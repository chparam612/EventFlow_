import { getCurrentUser, logout } from '/src/auth.js';
import { ZONES, setStaffOverride } from '/src/simulation.js';
import { writeStaffStatus, listenInstructions, ackInstruction } from '/src/firebase.js';

export function render() {
  const zoneId = localStorage.getItem('ef_zone') || 'north';
  const zoneName = ZONES[zoneId]?.name || 'Unknown Zone';
  
  return `
  <div class="fade-in" style="min-height:100vh; display:flex; flex-direction:column; background:var(--bg-deep);">
    <!-- Top Bar -->
    <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 16px; border-bottom:1px solid var(--border); background:var(--bg-card);">
      <div>
        <div style="font-family:'Space Grotesk',sans-serif; font-weight:700; color:var(--orange);">EventFlow Staff</div>
        <div style="font-size:0.8rem; color:var(--text-secondary);">${zoneName}</div>
      </div>
      <button id="btn-logout" style="background:transparent; border:1px solid var(--border); color:var(--text-secondary); padding:6px 12px; border-radius:6px; font-size:0.8rem;">Logout</button>
    </div>

    <div style="padding:16px; display:flex; flex-direction:column; gap:16px; flex:1;">
      <!-- Instruction Card -->
      <div style="background:var(--bg-card); border:1px solid var(--green); border-radius:12px; padding:16px;">
        <div style="font-size:0.75rem; color:var(--green); text-transform:uppercase; font-weight:600; margin-bottom:8px; display:flex; align-items:center; gap:6px;">
          <div style="width:6px; height:6px; border-radius:50%; background:var(--green); animation:spin 2s linear infinite;"></div>
          Live Instruction
        </div>
        <div id="instruction-text" style="font-size:1.1rem; font-weight:500; margin-bottom:12px;">No instructions — all clear ✓</div>
        <button id="btn-ack" style="width:100%; padding:10px; border-radius:6px; background:var(--green-dim); color:var(--green); border:1px solid var(--green); font-weight:600;" disabled>✓ Acknowledged</button>
      </div>

      <!-- Giant Status Toggle -->
      <div style="flex:1; display:flex; flex-direction:column; gap:12px; min-height:200px;">
        <p style="text-align:center; color:var(--text-secondary); font-size:0.85rem; margin:0;">Tap to update zone status</p>
        <button id="btn-clear" style="flex:1; border-radius:16px; border:2px solid var(--green); background:var(--green); color:#000; font-size:1.5rem; font-weight:700; transition:all 0.2s;">
          🟢 MY ZONE IS CLEAR
        </button>
        <button id="btn-crowded" style="flex:1; border-radius:16px; border:2px solid var(--red-dim); background:transparent; color:var(--red); font-size:1.5rem; font-weight:700; transition:all 0.2s;">
          🔴 MY ZONE IS CROWDED
        </button>
      </div>

      <!-- Quick Report -->
      <div>
        <p style="color:var(--text-secondary); font-size:0.85rem; margin-bottom:8px;">Quick Report</p>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
          <button class="quick-report" style="padding:12px; border-radius:8px; background:var(--bg-card); border:1px solid var(--border); color:var(--text-primary);">👥 Overcrowding</button>
          <button class="quick-report" style="padding:12px; border-radius:8px; background:var(--bg-card); border:1px solid var(--border); color:var(--text-primary);">✅ Area Clear</button>
          <button class="quick-report" style="padding:12px; border-radius:8px; background:var(--bg-card); border:1px solid var(--border); color:var(--text-primary);">🚑 Medical Needed</button>
          <button class="quick-report" style="padding:12px; border-radius:8px; background:var(--bg-card); border:1px solid var(--border); color:var(--text-primary);">⚠️ Other</button>
        </div>
      </div>
      
      <!-- Recent Reports -->
      <div id="recent-reports-container" style="font-size:0.8rem; color:var(--text-muted);">
        Recent: None
      </div>
    </div>
  </div>`;
}

export async function init(navigate) {
  const user = await getCurrentUser();
  const zoneId = localStorage.getItem('ef_zone') || 'north';
  
  if (!user || !user.email.includes('staff')) return;

  await writeStaffStatus(user.uid, zoneId, 'online');

  const btnAck = document.getElementById('btn-ack');
  const instrText = document.getElementById('instruction-text');
  
  // Listen for instructions
  const unsubInstr = listenInstructions(zoneId, (items) => {
    if (items.length > 0) {
      const latest = items[0];
      const isAcked = latest.acked && latest.acked[user.uid];

      instrText.textContent = latest.message;
      btnAck.disabled = isAcked;
      btnAck.style.background = isAcked ? 'var(--border)' : 'var(--green)';
      btnAck.style.color = isAcked ? 'var(--text-secondary)' : '#000';
      btnAck.textContent = isAcked ? '✓ Acknowledged' : 'Acknowledge';
      
      // Store current instruction ID for the click listener
      btnAck.dataset.latestId = latest.id;
    } else {
      instrText.textContent = 'No instructions — all clear ✓';
      btnAck.disabled = true;
      btnAck.style.background = 'var(--green-dim)';
      btnAck.style.color = 'var(--green)';
      btnAck.textContent = '✓ Acknowledged';
    }
  });

  btnAck.addEventListener('click', async () => {
    const id = btnAck.dataset.latestId;
    if (id) {
      await ackInstruction(id, user.uid);
      btnAck.disabled = true;
      btnAck.textContent = 'Acknowledging...';
    }
  });

  // Toggle status
  const btnClear = document.getElementById('btn-clear');
  const btnCrowded = document.getElementById('btn-crowded');
  let currentStatus = 'clear';

  function setStatusUI(status) {
    currentStatus = status;
    setStaffOverride(zoneId, status);
    if (status === 'clear') {
      btnClear.style.background = 'var(--green)';
      btnClear.style.color = '#000';
      btnClear.style.borderColor = 'var(--green)';
      btnCrowded.style.background = 'transparent';
      btnCrowded.style.color = 'var(--red)';
      btnCrowded.style.borderColor = 'var(--red-dim)';
    } else {
      btnCrowded.style.background = 'var(--red)';
      btnCrowded.style.color = '#fff';
      btnCrowded.style.borderColor = 'var(--red)';
      btnClear.style.background = 'transparent';
      btnClear.style.color = 'var(--green)';
      btnClear.style.borderColor = 'var(--green-dim)';
    }
    writeStaffStatus(user.uid, zoneId, status);
  }

  btnClear.addEventListener('click', () => setStatusUI('clear'));
  btnCrowded.addEventListener('click', () => setStatusUI('crowded'));

  // Quick report buttons
  const recents = document.getElementById('recent-reports-container');
  document.querySelectorAll('.quick-report').forEach(b => {
    b.addEventListener('click', () => {
      let msg = b.textContent;
      if (msg.includes('Other')) {
        const custom = prompt('Enter report details:');
        if (!custom) return;
        msg = '⚠️ ' + custom;
      }
      recents.innerHTML = `<div style="padding:4px 0;">${new Date().toLocaleTimeString()} - ${msg}</div>` + recents.innerHTML;
    });
  });

  document.getElementById('btn-logout').addEventListener('click', () => {
    logout();
  });

  return () => {
    writeStaffStatus(user.uid, zoneId, 'offline');
  };
}
