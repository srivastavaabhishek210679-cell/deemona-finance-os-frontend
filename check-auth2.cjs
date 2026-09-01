const fs = require('fs');
const f = 'C:/deemona-finance-os/frontend/src/components/auth/AuthPages.jsx';
let c = fs.readFileSync(f, 'utf8');

// 1. Add termsAccepted state after password state in register section
c = c.replace(
  "const [password, setPassword] = useState('');\n  const [loading, setLoading] = useState(false);\n  const [googleLoading",
  "const [password, setPassword] = useState('');\n  const [termsAccepted, setTermsAccepted] = useState(false);\n  const [loading, setLoading] = useState(false);\n  const [googleLoading"
);

// 2. Find register submit handler and add validation
// Look for the submit function
const submitIdx = c.indexOf('const handleRegister') > 0 ? c.indexOf('const handleRegister') : c.indexOf('const handleSubmit');
console.log('Submit handler at:', submitIdx);
console.log('Context:', c.substring(submitIdx, submitIdx+200));
