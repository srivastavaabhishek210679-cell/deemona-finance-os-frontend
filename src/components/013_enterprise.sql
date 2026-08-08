-- ============================================================
-- DEEMONA AI FINANCE OS — Enterprise Layer
-- Migration: 013_enterprise.sql
-- ============================================================

-- ── Plans ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS plans (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  price_monthly   NUMERIC(10,2) DEFAULT 0,
  price_yearly    NUMERIC(10,2) DEFAULT 0,
  max_users       INT DEFAULT 3,
  max_vendors     INT DEFAULT 50,
  max_customers   INT DEFAULT 50,
  max_invoices    INT DEFAULT 100,
  max_employees   INT DEFAULT 10,
  max_projects    INT DEFAULT 5,
  ai_calls_limit  INT DEFAULT 1000,
  modules         JSONB DEFAULT '[]',
  features        JSONB DEFAULT '[]',
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO plans (id, name, price_monthly, price_yearly, max_users, max_vendors, max_customers, max_invoices, max_employees, max_projects, ai_calls_limit, features) VALUES
('free',       'Free',       0,      0,      2,   10,  10,  20,  5,   2,   100,   '["Basic accounting","5 modules","Email support"]'),
('starter',    'Starter',    2999,   29990,  5,   100, 100, 500, 25,  10,  2000,  '["All 15 modules","AI Decision Center","Email support"]'),
('pro',        'Pro',        7999,   79990,  15,  500, 500, 2000,100, 50,  10000, '["All modules + AI agents","CFO Agent","Priority support","Tally sync"]'),
('enterprise', 'Enterprise', 24999,  249990, 999, -1,  -1,  -1,  -1,  -1,  -1,    '["Unlimited everything","Custom AI models","Dedicated support","SLA 99.9%","Custom domain"]')
ON CONFLICT (id) DO NOTHING;

-- ── Update tenants table ──────────────────────────────────────
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS plan_id TEXT DEFAULT 'free' REFERENCES plans(id);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS razorpay_customer_id TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '14 days';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- ── Roles ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL,
  name        TEXT NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '[]',
  is_system   BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- System roles (shared across tenants via is_system)
INSERT INTO roles (tenant_id, name, description, permissions, is_system) VALUES
('00000000-0000-0000-0000-000000000000'::uuid, 'owner',   'Full access to everything',
 '["*"]', TRUE),
('00000000-0000-0000-0000-000000000000'::uuid, 'admin',   'Admin access except billing',
 '["accounting.*","treasury.*","procurement.*","payroll.*","tax.*","budgeting.*","expenses.*","assets.*","inventory.*","projects.*","compliance.*","crm.*","reports.*","users.read","users.invite","settings.*"]', TRUE),
('00000000-0000-0000-0000-000000000000'::uuid, 'manager', 'Module access, approve transactions',
 '["accounting.read","accounting.approve","treasury.read","procurement.*","payroll.read","expenses.approve","projects.*","crm.*","reports.read"]', TRUE),
('00000000-0000-0000-0000-000000000000'::uuid, 'accountant', 'Full accounting access',
 '["accounting.*","treasury.read","expenses.read","reports.*","tax.read"]', TRUE),
('00000000-0000-0000-0000-000000000000'::uuid, 'staff',   'Read-only + submit expenses',
 '["accounting.read","treasury.read","expenses.submit","projects.read","crm.read","reports.read"]', TRUE),
('00000000-0000-0000-0000-000000000000'::uuid, 'viewer',  'Read-only access',
 '["accounting.read","treasury.read","reports.read","projects.read"]', TRUE)
ON CONFLICT DO NOTHING;

-- ── User role assignments ─────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS role_name TEXT DEFAULT 'owner';
ALTER TABLE users ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS department TEXT;

-- ── Invitations ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_invitations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL,
  invited_by    UUID NOT NULL REFERENCES users(id),
  email         TEXT NOT NULL,
  role_name     TEXT DEFAULT 'staff',
  token         TEXT NOT NULL UNIQUE,
  expires_at    TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  accepted_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Subscriptions ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL UNIQUE,
  plan_id               TEXT NOT NULL REFERENCES plans(id),
  status                TEXT DEFAULT 'trial',
  razorpay_sub_id       TEXT,
  razorpay_payment_id   TEXT,
  current_period_start  TIMESTAMPTZ DEFAULT NOW(),
  current_period_end    TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days',
  trial_end             TIMESTAMPTZ DEFAULT NOW() + INTERVAL '14 days',
  amount                NUMERIC(10,2) DEFAULT 0,
  currency              TEXT DEFAULT 'INR',
  billing_cycle         TEXT DEFAULT 'monthly',
  cancelled_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ── Payments ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL,
  subscription_id     UUID REFERENCES subscriptions(id),
  razorpay_payment_id TEXT UNIQUE,
  razorpay_order_id   TEXT,
  amount              NUMERIC(10,2) NOT NULL,
  currency            TEXT DEFAULT 'INR',
  status              TEXT DEFAULT 'created',
  plan_id             TEXT REFERENCES plans(id),
  description         TEXT,
  invoice_number      TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ── Usage tracking ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usage_metrics (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL,
  metric      TEXT NOT NULL,
  value       INT DEFAULT 0,
  period      TEXT NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tenant_id, metric, period)
);

-- ── Audit log ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL,
  user_id     UUID REFERENCES users(id),
  action      TEXT NOT NULL,
  resource    TEXT,
  resource_id TEXT,
  old_data    JSONB,
  new_data    JSONB,
  ip_address  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Platform admin ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS platform_admins (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name        TEXT,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_roles_tenant ON roles (tenant_id);
CREATE INDEX IF NOT EXISTS idx_invitations_tenant ON user_invitations (tenant_id);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON user_invitations (token);
CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant ON subscriptions (tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_tenant ON payments (tenant_id);
CREATE INDEX IF NOT EXISTS idx_usage_tenant ON usage_metrics (tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_tenant ON audit_log (tenant_id);
