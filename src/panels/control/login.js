import { loginWithEmail } from '/src/auth.js';

export function render() {
  return `
  <div class="fade-in" style="min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:1.5rem;">
    <div class="card" style="width:100%; max-width:360px; padding:2rem; border-radius:16px; border-color:var(--red-dim);">
      <h2 style="text-align:center; margin-bottom:0.5rem; color:var(--red);">Control Room</h2>
      <p style="text-align:center; color:var(--text-secondary); font-size:0.9rem; margin-bottom:2rem;">Command Center Access</p>
      
      <form id="control-login-form" style="display:flex; flex-direction:column; gap:1rem;">
        <input type="email" id="email" placeholder="control@eventflow.demo" required 
          style="padding:12px; border-radius:8px; border:1px solid var(--border); background:var(--bg-card2); color:#fff;">
        
        <input type="password" id="password" placeholder="Password" required 
          style="padding:12px; border-radius:8px; border:1px solid var(--border); background:var(--bg-card2); color:#fff;">
        
        <div id="error-msg" style="color:var(--red); font-size:0.85rem; display:none; text-align:center;"></div>
        
        <button type="submit" style="padding:14px; border-radius:8px; background:var(--red); color:#fff; font-weight:600; border:none; margin-top:0.5rem;">Login</button>
      </form>
      <div style="text-align:center; color:var(--text-muted); font-size:0.75rem; margin-top:1.5rem;">
        Demo: control@eventflow.demo / Control@123
      </div>
    </div>
  </div>
  `;
}

export async function init(navigate) {
  const form = document.getElementById('control-login-form');
  const errorMsg = document.getElementById('error-msg');
  const btn = form.querySelector('button');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMsg.style.display = 'none';
    const email = document.getElementById('email').value;
    const pwd = document.getElementById('password').value;

    btn.textContent = 'Logging in...';
    btn.style.opacity = '0.7';

    try {
      await loginWithEmail(email, pwd);
      navigate('/control');
    } catch(err) {
      errorMsg.textContent = err.message;
      errorMsg.style.display = 'block';
      btn.textContent = 'Login';
      btn.style.opacity = '1';
    }
  });
}
