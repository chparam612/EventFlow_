import { loginWithEmail } from '/src/auth.js';
import { ZONES } from '/src/simulation.js';

export function render() {
  const options = Object.entries(ZONES).map(([id, z]) => 
    `<option value="${id}">${z.name}</option>`
  ).join('');

  return `
  <div class="fade-in" style="min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:1.5rem;">
    <div class="card" style="width:100%; max-width:360px; padding:2rem; border-radius:16px; border-color:var(--orange-dim);">
      <h2 style="text-align:center; margin-bottom:0.5rem; color:var(--orange);">Staff Login</h2>
      <p style="text-align:center; color:var(--text-secondary); font-size:0.9rem; margin-bottom:2rem;">EventFlow Personnel</p>
      
      <form id="staff-login-form" style="display:flex; flex-direction:column; gap:1rem;">
        <input type="email" id="email" placeholder="staff@eventflow.demo" required 
          style="padding:12px; border-radius:8px; border:1px solid var(--border); background:var(--bg-card2); color:#fff;">
        
        <input type="password" id="password" placeholder="Password" required 
          style="padding:12px; border-radius:8px; border:1px solid var(--border); background:var(--bg-card2); color:#fff;">
        
        <select id="zone" required style="padding:12px; border-radius:8px; border:1px solid var(--border); background:var(--bg-card2); color:#fff;">
          <option value="" disabled selected>Select your zone</option>
          ${options}
        </select>
        
        <div id="error-msg" style="color:var(--red); font-size:0.85rem; display:none; text-align:center;"></div>
        
        <button type="submit" style="padding:14px; border-radius:8px; background:var(--orange); color:#000; font-weight:600; border:none; margin-top:0.5rem;">Login</button>
      </form>
      <div style="text-align:center; color:var(--text-muted); font-size:0.75rem; margin-top:1.5rem;">
        Demo: staff@eventflow.demo / Staff@123
      </div>
    </div>
  </div>
  `;
}

export async function init(navigate) {
  const form = document.getElementById('staff-login-form');
  const errorMsg = document.getElementById('error-msg');
  const btn = form.querySelector('button');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMsg.style.display = 'none';
    const email = document.getElementById('email').value;
    const pwd = document.getElementById('password').value;
    const zone = document.getElementById('zone').value;

    if (!zone) {
      errorMsg.textContent = 'Please select a zone';
      errorMsg.style.display = 'block';
      return;
    }

    btn.textContent = 'Logging in...';
    btn.style.opacity = '0.7';

    try {
      await loginWithEmail(email, pwd);
      localStorage.setItem('ef_zone', zone);
      navigate('/staff');
    } catch(err) {
      errorMsg.textContent = err.message;
      errorMsg.style.display = 'block';
      btn.textContent = 'Login';
      btn.style.opacity = '1';
    }
  });
}
