export function render() {
  return `
  <div class="fade-in" style="
    min-height:100vh; background:#060A10;
    display:flex; flex-direction:column;
    align-items:center; justify-content:center;
    padding:2rem 1.25rem; gap:2.5rem;">
    
    <!-- Logo -->
    <div style="text-align:center;">
      <div style="font-family:'Space Grotesk',sans-serif;
        font-size:2rem;font-weight:700;
        background:linear-gradient(135deg,#00C49A,#00E5B4);
        -webkit-background-clip:text;
        -webkit-text-fill-color:transparent;">
        EventFlow
      </div>
      <div style="color:#4A5568;font-size:0.85rem;margin-top:4px;">
        Narendra Modi Stadium · Ahmedabad
      </div>
    </div>
    
    <!-- Language Selector -->
    <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;">
      <button onclick="setLang('en')" id="lang-en"
        style="padding:6px 14px;border-radius:20px;border:1px solid rgba(255,255,255,0.15);
        background:rgba(0,196,154,0.15);color:#00C49A;font-size:0.78rem;">EN</button>
      <button onclick="setLang('hi')" id="lang-hi"
        style="padding:6px 14px;border-radius:20px;border:1px solid rgba(255,255,255,0.1);
        background:transparent;color:#8899A6;font-size:0.78rem;">हिंदी</button>
      <button onclick="setLang('gu')" id="lang-gu"
        style="padding:6px 14px;border-radius:20px;border:1px solid rgba(255,255,255,0.1);
        background:transparent;color:#8899A6;font-size:0.78rem;">ગુજરાતી</button>
      <button onclick="setLang('ta')" id="lang-ta"
        style="padding:6px 14px;border-radius:20px;border:1px solid rgba(255,255,255,0.1);
        background:transparent;color:#8899A6;font-size:0.78rem;">தமிழ்</button>
      <button onclick="setLang('te')" id="lang-te"
        style="padding:6px 14px;border-radius:20px;border:1px solid rgba(255,255,255,0.1);
        background:transparent;color:#8899A6;font-size:0.78rem;">తెలుగు</button>
    </div>
    
    <!-- Role Cards -->
    <div style="display:flex;flex-direction:column;gap:12px;width:100%;max-width:380px;">
    
      <!-- Fan Card -->
      <button id="btn-fan" style="
        background:#0D1421;border:1px solid rgba(0,196,154,0.2);
        border-radius:16px;padding:20px;text-align:left;
        transition:all 0.2s;width:100%;"
        onmouseover="this.style.borderColor='rgba(0,196,154,0.5)';this.style.background='rgba(0,196,154,0.05)'"
        onmouseout="this.style.borderColor='rgba(0,196,154,0.2)';this.style.background='#0D1421'">
        <div style="display:flex;align-items:center;gap:14px;">
          <div style="width:48px;height:48px;border-radius:12px;
            background:rgba(0,196,154,0.12);display:flex;
            align-items:center;justify-content:center;font-size:22px;">🎟️</div>
          <div>
            <div style="font-family:'Space Grotesk',sans-serif;
              font-weight:600;color:#F0F4F8;font-size:1rem;">Match Attendee</div>
            <div style="color:#8899A6;font-size:0.82rem;margin-top:2px;">
              Your personal crowd-free match plan</div>
          </div>
          <div style="margin-left:auto;color:#00C49A;font-size:1.1rem;">→</div>
        </div>
      </button>
      
      <!-- Staff Card -->
      <button id="btn-staff" style="
        background:#0D1421;border:1px solid rgba(255,107,53,0.2);
        border-radius:16px;padding:20px;text-align:left;
        transition:all 0.2s;width:100%;"
        onmouseover="this.style.borderColor='rgba(255,107,53,0.5)';this.style.background='rgba(255,107,53,0.04)'"
        onmouseout="this.style.borderColor='rgba(255,107,53,0.2)';this.style.background='#0D1421'">
        <div style="display:flex;align-items:center;gap:14px;">
          <div style="width:48px;height:48px;border-radius:12px;
            background:rgba(255,107,53,0.1);display:flex;
            align-items:center;justify-content:center;font-size:22px;">🧑‍✈️</div>
          <div>
            <div style="font-family:'Space Grotesk',sans-serif;
              font-weight:600;color:#F0F4F8;font-size:1rem;">Ground Staff</div>
            <div style="color:#8899A6;font-size:0.82rem;margin-top:2px;">
              Zone reporting and live instructions</div>
          </div>
          <div style="margin-left:auto;color:#FF6B35;font-size:1.1rem;">→</div>
        </div>
      </button>
      
      <!-- Control Card -->
      <button id="btn-control" style="
        background:#0D1421;border:1px solid rgba(255,71,87,0.2);
        border-radius:16px;padding:20px;text-align:left;
        transition:all 0.2s;width:100%;"
        onmouseover="this.style.borderColor='rgba(255,71,87,0.5)';this.style.background='rgba(255,71,87,0.04)'"
        onmouseout="this.style.borderColor='rgba(255,71,87,0.2)';this.style.background='#0D1421'">
        <div style="display:flex;align-items:center;gap:14px;">
          <div style="width:48px;height:48px;border-radius:12px;
            background:rgba(255,71,87,0.1);display:flex;
            align-items:center;justify-content:center;font-size:22px;">🖥️</div>
          <div>
            <div style="font-family:'Space Grotesk',sans-serif;
              font-weight:600;color:#F0F4F8;font-size:1rem;">Control Room</div>
            <div style="color:#8899A6;font-size:0.82rem;margin-top:2px;">
              Command center — authorized access</div>
          </div>
          <div style="margin-left:auto;color:#FF4757;font-size:1.1rem;">→</div>
        </div>
      </button>
    </div>
    
    <!-- Footer -->
    <div style="color:#2D3748;font-size:0.75rem;text-align:center;">
      EventFlow v2.0 · Google Prompt Wars 2026
    </div>
  </div>`;
}

export async function init(navigate) {
  const { loginAnonymously } = await import('/src/auth.js');
  
  // Language buttons
  window.setLang = async (lang) => {
    localStorage.setItem('ef_lang', lang);
    document.querySelectorAll('[id^="lang-"]').forEach(b => {
      const isActive = b.id === 'lang-'+lang;
      b.style.background = isActive ? 'rgba(0,196,154,0.15)' : 'transparent';
      b.style.color = isActive ? '#00C49A' : '#8899A6';
      b.style.borderColor = isActive ? 'rgba(0,196,154,0.4)' : 'rgba(255,255,255,0.1)';
    });
  };
  
  // Restore language
  const lang = localStorage.getItem('ef_lang') || 'en';
  window.setLang(lang);
  
  // Fan button
  document.getElementById('btn-fan')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-fan');
    btn.style.opacity = '0.7';
    await loginAnonymously();
    navigate('/attendee');
  });
  
  // Staff button
  document.getElementById('btn-staff')?.addEventListener('click', () => {
    navigate('/staff-login');
  });
  
  // Control button
  document.getElementById('btn-control')?.addEventListener('click', () => {
    navigate('/control-login');
  });
}
