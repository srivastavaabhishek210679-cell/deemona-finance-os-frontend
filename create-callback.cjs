const fs = require('fs');
const content = `import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiURL } from '../../api.js';
import { useAuth } from '../../context/AuthContext';

export default function GoogleCallback() {
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const idToken = params.get('id_token');
    if (!idToken) { navigate('/login'); return; }

    fetch(apiURL('/api/auth/google'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_token: idToken }),
    })
    .then(r => r.json())
    .then(data => {
      if (data.token) {
        login(data.token, data.user);
        navigate('/');
      } else {
        navigate('/login?error=' + encodeURIComponent(data.error || 'Google login failed'));
      }
    })
    .catch(() => navigate('/login?error=Google+login+failed'));
  }, []);

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f0f4ff'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:32,marginBottom:12}}>&#10003;</div>
        <div style={{fontSize:16,fontWeight:700,color:'#1e3a8a'}}>Signing you in...</div>
        <div style={{fontSize:12,color:'#64748b',marginTop:6}}>Please wait</div>
      </div>
    </div>
  );
}`;
fs.mkdirSync('C:/deemona-finance-os/frontend/src/components/auth', {recursive:true});
fs.writeFileSync('C:/deemona-finance-os/frontend/src/components/auth/GoogleCallback.jsx', content, 'utf8');
console.log('GoogleCallback.jsx created');
