import { getCurrentUser, logout } from '/src/auth.js';
import { ZONES, simulateTick, setTick, getTick } from '/src/simulation.js';
import { writeZone, listenZones, listenAllStaff, pushInstruction, pushNudge } from '/src/firebase.js';
import { getAIInsights } from '/src/gemini.js';

export function render() {
  const options = Object.entries(ZONES).map(([id, z]) => 
    `<option value="${id}">${z.name}</option>`
  ).join('');

  return `
  <div class="fade-in" style="min-height:100vh; display:flex; flex-direction:column; background:var(--bg-deep);">
    <!-- Top Bar -->
    <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 24px; border-bottom:1px solid var(--border); background:var(--bg-card);">
      <div style="font-family:'Space Grotesk',sans-serif; font-weight:700; color:var(--text-primary);">
        <span style="color:var(--red);">EventFlow COMMAND CENTER | LIVE</span> — NMS | 
        <span id="attendee-count">45,200</span> inside | <span id="current-time">18:00</span>
      </div>
      <button id="btn-logout" style="background:transparent; border:1px solid var(--border); color:var(--text-secondary); padding:6px 12px; border-radius:6px; font-size:0.8rem;">Logout</button>
    </div>

    <div style="display:flex; flex:1; overflow:hidden;">
      
      <!-- LEFT COLUMN -->
      <div style="width:22%; border-right:1px solid var(--border); background:var(--bg-card); display:flex; flex-direction:column;">
        <div style="padding:16px; font-family:'Space Grotesk',sans-serif; font-weight:600; border-bottom:1px solid var(--border);">Staff Online</div>
        <div id="staff-list" style="flex:1; overflow-y:auto; padding:8px;">
          <!-- dynamic staff rows -->
        </div>
      </div>

      <!-- MIDDLE COLUMN -->
      <div style="width:54%; display:flex; flex-direction:column; background:#000;">
        <div id="nms-map" style="flex:1; width:100%;"></div>
        <div style="padding:16px; background:var(--bg-card); border-top:1px solid var(--border);">
          <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:0.85rem; color:var(--text-secondary);">
            <span>18:00</span><span>Demo Simulation Mode</span><span>02:00</span>
          </div>
          <input type="range" id="sim-scrubber" min="0" max="480" value="0" style="width:100%; accent-color:var(--red);">
          <div style="text-align:center; margin-top:4px; font-family:'Space Grotesk',sans-serif; font-size:0.9rem;" id="sim-time-label">Tick: 0 min (18:00)</div>
        </div>
      </div>

      <!-- RIGHT COLUMN -->
      <div style="width:24%; border-left:1px solid var(--border); background:var(--bg-card); display:flex; flex-direction:column;">
        
        <!-- Action Control -->
        <div style="padding:16px; border-bottom:1px solid var(--border);">
          <div style="font-family:'Space Grotesk',sans-serif; font-weight:600; margin-bottom:12px; color:var(--text-primary);">Dispatch Instruction</div>
          <select id="dispatch-zone" style="width:100%; padding:8px; margin-bottom:8px; border-radius:6px;">
            ${options}
          </select>
          <div style="display:flex; flex-wrap:wrap; gap:4px; margin-bottom:8px;">
            <button class="quick-btn" style="padding:4px 8px; font-size:0.75rem; background:var(--bg-card2); border:1px solid var(--border); color:var(--text-secondary); border-radius:4px;">Redirect to Gate wait</button>
            <button class="quick-btn" style="padding:4px 8px; font-size:0.75rem; background:var(--bg-card2); border:1px solid var(--border); color:var(--text-secondary); border-radius:4px;">Reduce entry</button>
            <button class="quick-btn" style="padding:4px 8px; font-size:0.75rem; background:var(--bg-card2); border:1px solid var(--border); color:var(--text-secondary); border-radius:4px;">Open backup gate</button>
            <button class="quick-btn" style="padding:4px 8px; font-size:0.75rem; background:var(--bg-card2); border:1px solid var(--border); color:var(--text-secondary); border-radius:4px;">Medical team</button>
          </div>
          <input type="text" id="dispatch-msg" placeholder="Custom message..." style="width:100%; padding:8px; margin-bottom:12px; border-radius:6px;">
          
          <div style="display:flex; gap:8px;">
            <button id="btn-send-staff" style="flex:1; padding:8px; background:var(--orange); color:#000; border:none; border-radius:6px; font-weight:600; font-size:0.8rem;">Send to Staff</button>
            <button id="btn-nudge" style="flex:1; padding:8px; background:var(--blue, #3182CE); color:#fff; border:none; border-radius:6px; font-weight:600; font-size:0.8rem;">Nudge Attendees</button>
          </div>
        </div>

        <!-- Alerts & Insights -->
        <div style="flex:1; padding:16px; overflow-y:auto;">
          <div style="font-family:'Space Grotesk',sans-serif; font-weight:600; margin-bottom:8px; color:var(--red);">Live Alerts</div>
          <div id="alerts-container" style="display:flex; flex-direction:column; gap:8px; margin-bottom:16px;"></div>

          <div style="font-family:'Space Grotesk',sans-serif; font-weight:600; margin-bottom:8px; color:var(--green);">AI Insights</div>
          <div id="insights-container" style="display:flex; flex-direction:column; gap:8px;">
            <div style="color:var(--text-muted); font-size:0.8rem;">Loading insights...</div>
          </div>
        </div>

        <div style="padding:12px 16px; border-top:1px solid var(--border); font-size:0.75rem; color:var(--text-secondary); display:flex; justify-content:space-between;">
          <span>Staff: <span id="staff-count">0</span></span>
          <span>Nudges: <span id="nudge-count">0</span></span>
        </div>
      </div>
    </div>
  </div>`;
}

export async function init(navigate) {
  const user = await getCurrentUser();
  if (!user || (!user.email.includes('control') && !user.email.includes('admin'))) return;

  let map;
  let zoneRects = {};
  let currentDensities = {};
  let intervalId;
  let nudgeCounter = 0;

  const staffList = document.getElementById('staff-list');
  const alertContainer = document.getElementById('alerts-container');
  const insightsContainer = document.getElementById('insights-container');
  const scrubber = document.getElementById('sim-scrubber');
  const msgInput = document.getElementById('dispatch-msg');
  const selectZone = document.getElementById('dispatch-zone');

  function initGoogleMap() {
    map = new google.maps.Map(document.getElementById('nms-map'), {
      center: { lat: 23.0925, lng: 72.5952 },
      zoom: 17,
      mapTypeId: 'satellite',
      disableDefaultUI: true
    });

    const rects = {
      north: { n: 23.0955, s: 23.0935, e: 72.5972, w: 72.5932 },
      south: { n: 23.0915, s: 23.0895, e: 72.5972, w: 72.5932 },
      east:  { n: 23.0935, s: 23.0915, e: 72.5992, w: 72.5972 },
      west:  { n: 23.0935, s: 23.0915, e: 72.5932, w: 72.5912 },
      gates: { n: 23.0960, s: 23.0950, e: 72.5955, w: 72.5945 }
    };

    for (const [id, bounds] of Object.entries(rects)) {
      zoneRects[id] = new google.maps.Rectangle({
        strokeColor: '#FFFFFF',
        strokeOpacity: 0.8,
        strokeWeight: 1,
        fillColor: '#00C49A',
        fillOpacity: 0.25,
        map: map,
        bounds: { north: bounds.n, south: bounds.s, east: bounds.e, west: bounds.w }
      });
      // Add markers
      new google.maps.Marker({
        position: { lat: (bounds.n + bounds.s)/2, lng: (bounds.e + bounds.w)/2 },
        map: map, label: { text: ZONES[id]?.name || id, color: 'white', fontSize: '10px' },
        icon: { path: google.maps.SymbolPath.CIRCLE, scale: 0 }
      });
    }
  }

  if (window.google && window.google.maps) {
    initGoogleMap();
  } else {
    window.addEventListener('mapsReady', initGoogleMap);
  }

  // Sync zones
  function updateMapColors(zones) {
    alertContainer.innerHTML = '';
    currentDensities = {};
    for (const [id, data] of Object.entries(zones)) {
      currentDensities[id] = data.density;
      if (zoneRects[id]) {
        let color = '#00C49A'; let op = 0.25;
        if (data.density >= 0.8) { color = '#FF4757'; op = 0.45; }
        else if (data.density >= 0.6) { color = '#FFD166'; op = 0.35; }
        zoneRects[id].setOptions({ fillColor: color, fillOpacity: op });
      }

      if (data.density >= 0.8) {
        alertContainer.innerHTML += `
        <div style="background:var(--red-dim); border:1px solid var(--red); padding:8px; border-radius:6px; display:flex; justify-content:space-between; align-items:center;">
          <div><span style="font-weight:600; color:#fff;">${ZONES[id]?.name || id}</span> <span style="color:var(--text-secondary);">${Math.round(data.density*100)}% cap</span></div>
        </div>`;
      }
    }
  }

  listenZones((zones) => {
    updateMapColors(zones);
  });

  listenAllStaff((staff) => {
    staffList.innerHTML = '';
    let c = 0;
    for (const [uid, d] of Object.entries(staff)) {
      if (d.online) c++;
      const zName = ZONES[d.zone]?.name || d.zone;
      const color = d.status === 'crowded' ? 'var(--red)' : 'var(--green)';
      staffList.innerHTML += `
      <div style="padding:8px 6px; border-bottom:1px solid var(--border); display:flex; gap:8px; align-items:center; cursor:pointer;" onclick="document.getElementById('dispatch-zone').value='${d.zone}'">
        <div style="width:8px; height:8px; border-radius:50%; background:${color};"></div>
        <div style="flex:1;">
          <div style="color:var(--text-primary); font-size:0.85rem;">${zName}</div>
          <div style="color:var(--text-secondary); font-size:0.7rem;">${d.status.toUpperCase()} </div>
        </div>
      </div>`;
    }
    document.getElementById('staff-count').textContent = c;
  });

  // Simulation scrubber
  scrubber.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    setTick(val);
    const hrs = Math.floor(val/60) + 18;
    const mins = String(val%60).padStart(2,'0');
    document.getElementById('sim-time-label').textContent = `Tick: ${val} min (${hrs%24}:${mins})`;
    
    // push to firebase
    const dens = simulateTick();
    let total = 0;
    for (let id in dens) {
      writeZone(id, dens[id], 'update');
      total += dens[id] * (ZONES[id]?.cap || 1000);
    }
    document.getElementById('attendee-count').textContent = total.toLocaleString(undefined, {maximumFractionDigits:0});
  });

  // Auto sim
  intervalId = setInterval(() => {
    const dens = simulateTick();
    const val = getTick();
    scrubber.value = val;
    let total = 0;
    for (let id in dens) {
      writeZone(id, dens[id], 'update');
      total += dens[id] * (ZONES[id]?.cap || 1000);
    }
    document.getElementById('attendee-count').textContent = total.toLocaleString(undefined, {maximumFractionDigits:0});
  }, 5000);

  // Quick buttons
  document.querySelectorAll('.quick-btn').forEach(btn => {
    btn.addEventListener('click', () => msgInput.value = btn.textContent);
  });

  document.getElementById('btn-send-staff').addEventListener('click', () => {
    if (msgInput.value) {
      pushInstruction(selectZone.value, msgInput.value, user.email);
      msgInput.value = '';
    }
  });

  document.getElementById('btn-nudge').addEventListener('click', () => {
    if (msgInput.value) {
      pushNudge(selectZone.value, msgInput.value);
      nudgeCounter++;
      document.getElementById('nudge-count').textContent = nudgeCounter;
      msgInput.value = '';
    }
  });

  document.getElementById('btn-logout').addEventListener('click', () => {
    logout();
  });

  // AI insights
  async function fetchAI() {
    const res = await getAIInsights(currentDensities);
    insightsContainer.innerHTML = '';
    res.insights?.forEach(ins => {
      const col = ins.type === 'action' ? 'var(--orange)' : (ins.type === 'warning' ? 'var(--red)' : 'var(--blue)');
      insightsContainer.innerHTML += `
      <div style="background:var(--bg-card2); border-left:3px solid ${col}; padding:8px; border-radius:4px;">
        <div style="font-size:0.75rem; color:${col}; font-weight:600; margin-bottom:2px;">${ins.zone.toUpperCase()}</div>
        <div style="font-size:0.8rem; color:var(--text-primary);">${ins.message}</div>
        ${ins.action ? `<div style="font-size:0.75rem; color:var(--text-secondary); margin-top:2px;">→ ${ins.action}</div>` : ''}
      </div>`;
    });
  }

  fetchAI();
  setInterval(fetchAI, 120000);

  return () => {
    clearInterval(intervalId);
  };
}
