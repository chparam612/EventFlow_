import { saveAttendeeData, listenZones, listenNudges, saveFeedback } from '/src/firebase.js';
import { getRecommendedGate, getZoneStatus, getStatusColor, getExitPlan, simulateTick, ZONES } from '/src/simulation.js';
import { renderAIChat, initAIChat } from './aiChat.js';

let state = {
  screen: 'intake',
  intakeStep: 1,
  data: {},
  liveZones: {},
  nudges: []
};

let rootNav = null;

const lang = () => {
  // Simple fake lang fetcher for demo
  return localStorage.getItem('ef_lang') || 'en';
};

function h(str) { return str; } // simple translating helper

export function render() {
  const s = state.screen;
  let html = '';
  if (s === 'intake') html = renderIntake();
  if (s === 'plan') html = renderPlan();
  if (s === 'escort') html = renderEscort();
  if (s === 'during') html = renderDuring();
  if (s === 'exit') html = renderExit();
  if (s === 'feedback') html = renderFeedback();
  
  return `<div id="att-container" style="min-height:100vh; background:var(--bg-deep);">${html}</div>`;
}

function updateView() {
  const c = document.getElementById('att-container');
  if (c) c.outerHTML = render();
  bindEvents();
}

function renderIntake() {
  const step = state.intakeStep;
  let q = ''; let opts = [];
  if (step === 1) { q = "When are you arriving?"; opts = ['Before 5 PM', '5–6 PM', '6–7 PM', 'After 7 PM']; }
  if (step === 2) { q = "How many in your group?"; opts = ['Just me', '2–3', '4–6', '7+']; }
  if (step === 3) { q = "How are you getting here?"; opts = ['Car/Bike', 'Metro/Bus', 'Auto/Cab', 'Walking']; }
  if (step === 4) { q = "Parking zone?"; opts = ['P1 North', 'P2 South', 'P3 East', 'P4 West']; }
  if (step === 5) { q = "Where are you going after?"; opts = ['Home North', 'Home South', 'Home East', 'Home West', 'Station', 'Airport']; }

  const progress = (step / 5) * 100;

  return `
  <div class="fade-in" style="padding:24px; display:flex; flex-direction:column; min-height:100vh;">
    <div style="height:4px; background:var(--bg-card); border-radius:2px; margin-bottom:32px;">
      <div style="height:100%; width:${progress}%; background:var(--green); border-radius:2px; transition:width 0.3s;"></div>
    </div>
    <div style="flex:1;">
      <h2 style="font-size:1.8rem; margin-bottom:24px; color:var(--text-primary);">${q}</h2>
      <div style="display:flex; flex-direction:column; gap:12px;">
        ${opts.map(o => `<button class="intake-opt" data-val="${o}" style="padding:16px; border-radius:12px; background:var(--bg-card); border:1px solid var(--border); color:var(--text-primary); font-size:1.1rem; text-align:left;">${o}</button>`).join('')}
      </div>
    </div>
    ${renderAIChat()}
  </div>`;
}

function renderPlan() {
  const seat = 'north'; // hardcoded for demo
  const gate = getRecommendedGate(seat, state.liveZones);
  const statusHtml = Object.entries(ZONES).slice(0,4).map(([id,z]) => {
    const d = state.liveZones[id]?.density || 0;
    const st = getZoneStatus(d);
    const col = getStatusColor(st);
    return `
    <div style="background:var(--bg-card2); padding:8px 12px; border-radius:8px; border-left:3px solid ${col};">
      <div style="font-size:0.75rem; color:var(--text-secondary);">${z.name}</div>
      <div style="font-size:0.9rem; color:${col}; font-weight:600; text-transform:capitalize;">${st}</div>
    </div>`;
  }).join('');

  return `
  <div class="fade-in" style="padding:20px 16px; padding-bottom:100px;">
    <h2 style="margin-bottom:20px; font-size:1.5rem;">Welcome to the Match! 🏏</h2>
    
    <div class="card" style="padding:20px; border-radius:16px; margin-bottom:20px; border-color:var(--green-dim); background:linear-gradient(180deg, var(--bg-card) 0%, rgba(0,196,154,0.05) 100%);">
      <div style="color:var(--green); font-size:0.8rem; font-weight:600; text-transform:uppercase; margin-bottom:8px;">Recommended Gate</div>
      <div style="font-family:'Space Grotesk',sans-serif; font-size:2rem; font-weight:700; margin-bottom:4px;">Gate ${gate}</div>
      <div style="color:var(--text-secondary); font-size:0.85rem; margin-bottom:16px;">Based on live crowd density</div>
      <button id="btn-escort" style="width:100%; padding:14px; border-radius:8px; background:var(--green); color:#000; font-weight:600; border:none; font-size:1rem;">Take Me There →</button>
    </div>

    <h3 style="font-size:1.1rem; margin-bottom:12px; color:var(--text-primary);">Live Zone Status</h3>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:24px;">${statusHtml}</div>

    <h3 style="font-size:1.1rem; margin-bottom:12px; color:var(--text-primary);">Your Timeline</h3>
    <div style="margin-left:8px; border-left:2px solid var(--border); padding-left:16px; display:flex; flex-direction:column; gap:16px;">
      <div style="position:relative;"><div style="width:10px;height:10px;border-radius:50%;background:var(--green);position:absolute;left:-22px;top:4px;"></div><div style="font-weight:600;">Arrive at NMS</div><div style="font-size:0.8rem;color:var(--text-secondary);">Gate ${gate}</div></div>
      <div style="position:relative;"><div style="width:10px;height:10px;border-radius:50%;background:var(--border);position:absolute;left:-22px;top:4px;"></div><div style="font-weight:600;">Match Starts</div><div style="font-size:0.8rem;color:var(--text-secondary);">19:30 IST</div></div>
      <div style="position:relative;"><div style="width:10px;height:10px;border-radius:50%;background:var(--border);position:absolute;left:-22px;top:4px;"></div><div style="font-weight:600;">Innings Break</div><div style="font-size:0.8rem;color:var(--text-secondary);">Snacks & Restroom</div></div>
    </div>
    
    <div style="margin-top:24px; padding:16px; border-radius:12px; background:var(--bg-card); border:1px solid var(--border); display:flex; justify-content:space-between; align-items:center;">
      <div>
        <div style="font-weight:600; font-size:0.9rem;">Exit Plan Ready</div>
        <div style="color:var(--text-secondary); font-size:0.75rem;">Check 20 mins before leaving</div>
      </div>
      <button id="btn-see-exit" style="padding:6px 12px; border-radius:6px; background:transparent; border:1px solid var(--orange); color:var(--orange); font-size:0.8rem;">See Exit</button>
    </div>

    ${renderAIChat()}
  </div>`;
}

function renderEscort() {
  return `
  <div class="fade-in" style="min-height:100vh; display:flex; flex-direction:column; background:#000;">
    <div id="map-escort" style="height:35vh; width:100%; background:var(--bg-card);"></div>
    <div style="flex:1; background:var(--bg-deep); border-top-left-radius:24px; border-top-right-radius:24px; margin-top:-24px; padding:24px; display:flex; flex-direction:column;">
      <div style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:8px;">Step 1 of 4</div>
      <h2 style="font-size:1.6rem; margin-bottom:16px; line-height:1.2;">Head towards North Gate B, keeping left on the main path.</h2>
      
      <div style="background:rgba(0,196,154,0.1); border:1px solid rgba(0,196,154,0.3); padding:12px; border-radius:8px; display:flex; align-items:center; gap:12px; margin-bottom:auto;">
        <div style="width:12px; height:12px; border-radius:50%; background:var(--green);"></div>
        <div style="color:var(--text-primary); font-size:0.9rem;">Path is currently clear (Est: 3 mins)</div>
      </div>
      
      <button id="btn-arrived" style="width:100%; padding:16px; border-radius:12px; background:var(--green); color:#000; font-weight:600; font-size:1.1rem; border:none; margin-top:24px;">I've Arrived →</button>
    </div>
  </div>`;
}

function renderDuring() {
  const nudgeHtml = state.nudges.length > 0 ? `
  <div class="fade-in" style="background:var(--bg-card); border:1px solid var(--blue, #3182CE); border-radius:12px; padding:16px; margin-bottom:20px;">
    <div style="color:var(--blue, #3182CE); font-size:0.75rem; font-weight:600; text-transform:uppercase; margin-bottom:8px;">Live Update</div>
    <div style="font-size:1rem; margin-bottom:12px;">${state.nudges[state.nudges.length-1].message}</div>
    <button id="btn-guide-me" style="padding:8px 16px; border-radius:6px; background:var(--blue, #3182CE); color:#fff; border:none; font-size:0.85rem; font-weight:600;">Guide Me</button>
  </div>` : '';

  return `
  <div class="fade-in" style="padding:20px 16px; padding-bottom:100px;">
    <h2 style="margin-bottom:20px; font-size:1.5rem;">Match is Live 🏏</h2>
    
    ${nudgeHtml}
    
    <div class="card" style="padding:0; border-radius:16px; overflow:hidden; margin-bottom:20px;">
      <div style="padding:12px 16px; border-bottom:1px solid var(--border); font-weight:600; font-size:0.9rem;">Venue Map</div>
      <div id="map-live" style="height:200px; width:100%; background:var(--bg-card);"></div>
    </div>
    
    <button id="btn-to-exit" style="width:100%; padding:14px; border-radius:8px; background:var(--bg-card2); color:var(--text-primary); border:1px solid var(--border); font-size:1rem;">Plan Exit / Leave</button>

    ${renderAIChat()}
  </div>`;
}

function renderExit() {
  const plans = getExitPlan('north', state.data.q3 || 'Walking', state.liveZones);
  
  const optionsHtml = plans.map((p, i) => `
  <div class="exit-card card" style="padding:16px; border-radius:12px; margin-bottom:12px; border-color:${i===0 ? 'var(--green)' : 'var(--border)'}; background:${i===0 ? 'rgba(0,196,154,0.05)' : 'var(--bg-card)'};">
    <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
      <div style="font-weight:600; font-size:1.1rem; color:${i===0 ? 'var(--green)' : 'var(--text-primary)'}">${p.label}</div>
      <div style="font-size:0.85rem; color:var(--text-secondary);">Est. ${p.eta} min</div>
    </div>
    <div style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:12px;">${p.note}</div>
    <button class="btn-start-exit" style="width:100%; padding:10px; border-radius:6px; background:${i===0 ? 'var(--green)' : 'var(--bg-card2)'}; color:${i===0 ? '#000' : '#fff'}; border:${i===0 ? 'none' : '1px solid var(--border)'}; font-weight:600; font-size:0.9rem;">Start Exit Guide</button>
  </div>`).join('');

  return `
  <div class="fade-in" style="padding:20px 16px;">
    <h2 style="margin-bottom:20px; font-size:1.5rem;">Your Exit Plan</h2>
    ${optionsHtml}
    <button id="btn-back-during" style="margin-top:12px; width:100%; padding:14px; background:transparent; border:none; color:var(--text-secondary);">Cancel</button>
  </div>`;
}

function renderFeedback() {
  return `
  <div class="fade-in" style="min-height:100vh; display:flex; flex-direction:column; padding:24px; padding-top:10vh;">
    <h2 style="font-size:1.8rem; margin-bottom:8px; text-align:center;">How was today?</h2>
    <p style="color:var(--text-secondary); text-align:center; margin-bottom:32px;">Help us improve EventFlow</p>
    
    <div style="display:flex; justify-content:center; gap:12px; margin-bottom:32px; font-size:2rem; cursor:pointer;" id="star-rating">
      <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
    </div>

    <div style="font-size:0.9rem; margin-bottom:12px;">What went well?</div>
    <div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:32px;">
      <div class="fb-chip" style="padding:8px 16px; border-radius:20px; border:1px solid var(--border); color:var(--text-primary);">Entry</div>
      <div class="fb-chip" style="padding:8px 16px; border-radius:20px; border:1px solid var(--border); color:var(--text-primary);">Finding Seat</div>
      <div class="fb-chip" style="padding:8px 16px; border-radius:20px; border:1px solid var(--border); color:var(--text-primary);">Food</div>
      <div class="fb-chip" style="padding:8px 16px; border-radius:20px; border:1px solid var(--border); color:var(--text-primary);">Restrooms</div>
      <div class="fb-chip" style="padding:8px 16px; border-radius:20px; border:1px solid var(--border); color:var(--border-accent); border-color:var(--border-accent);">All Good!</div>
    </div>

    <button id="btn-submit-fb" style="margin-top:auto; width:100%; padding:16px; border-radius:12px; background:var(--green); color:#000; font-weight:600; font-size:1.1rem; border:none;">Submit Feedback</button>
  </div>`;
}

function bindEvents() {
  // Intake
  document.querySelectorAll('.intake-opt').forEach(b => {
    b.addEventListener('click', async () => {
      state.data[`q${state.intakeStep}`] = b.dataset.val;
      if (state.intakeStep === 3 && b.dataset.val !== 'Car/Bike') state.intakeStep++; // skip parking
      if (state.intakeStep < 5) {
        state.intakeStep++;
        updateView();
      } else {
        const uid = localStorage.getItem('ef_uid') || 'demo';
        try {
          await saveAttendeeData(uid, state.data);
        } catch(err) {
          console.warn("DB save failed, proceeding anyway", err);
        }
        state.screen = 'plan';
        updateView();
      }
    });
  });

  // Plans & Nav
  document.getElementById('btn-escort')?.addEventListener('click', () => { state.screen = 'escort'; updateView(); });
  document.getElementById('btn-see-exit')?.addEventListener('click', () => { state.screen = 'exit'; updateView(); });
  document.getElementById('btn-arrived')?.addEventListener('click', () => { state.screen = 'during'; updateView(); });
  document.getElementById('btn-to-exit')?.addEventListener('click', () => { state.screen = 'exit'; updateView(); });
  document.getElementById('btn-back-during')?.addEventListener('click', () => { state.screen = 'during'; updateView(); });
  document.getElementById('btn-guide-me')?.addEventListener('click', () => { state.screen = 'escort'; updateView(); });
  
  // Exit starts
  document.querySelectorAll('.btn-start-exit').forEach(b => {
    b.addEventListener('click', () => {
      // Fake completing exit for demo
      state.screen = 'feedback'; updateView();
    });
  });

  // Feedback
  let rating = 5;
  const stars = document.getElementById('star-rating');
  if (stars) {
    stars.querySelectorAll('span').forEach((s, i) => {
      s.addEventListener('click', () => {
        rating = i + 1;
        stars.querySelectorAll('span').forEach((ss, j) => {
          ss.style.color = j <= i ? 'var(--yellow)' : 'var(--text-secondary)';
        });
      });
      if (i < 5) s.style.color = 'var(--yellow)';
    });
  }
  
  const chips = [];
  document.querySelectorAll('.fb-chip').forEach(c => {
    c.addEventListener('click', () => {
      c.style.background = c.style.background ? '' : 'rgba(0,196,154,0.1)';
      c.style.borderColor = c.style.borderColor === 'var(--green)' ? 'var(--border)' : 'var(--green)';
      chips.push(c.textContent);
    });
  });

  document.getElementById('btn-submit-fb')?.addEventListener('click', async () => {
    await saveFeedback({ rating, tags: chips });
    document.getElementById('att-container').innerHTML = `<div style="height:100vh;display:flex;align-items:center;justify-content:center;font-size:1.5rem;color:var(--green);">Thank You! 🎉</div>`;
    setTimeout(() => { if (rootNav) rootNav('/'); }, 2000);
  });

  // Init AI Chat if present
  if (state.screen === 'plan' || state.screen === 'during' || state.screen === 'intake') {
    initAIChat(() => state.liveZones);
  }

  // Init Maps if present
  if (state.screen === 'escort' || state.screen === 'during') {
    initMaps();
  }
}

function initMaps() {
  const mapIds = { 'map-escort': { lat: 23.0955, lng: 72.5952, z: 18 }, 'map-live': { lat: 23.0925, lng: 72.5952, z: 16 } };
  
  const setup = () => {
    for (const [id, cfg] of Object.entries(mapIds)) {
      const el = document.getElementById(id);
      if (el) {
        new google.maps.Map(el, {
          center: { lat: cfg.lat, lng: cfg.lng },
          zoom: cfg.z,
          mapTypeId: 'satellite',
          disableDefaultUI: true
        });
      }
    }
  };

  if (window.google && window.google.maps) setup();
  else window.addEventListener('mapsReady', setup, { once: true });
}

export async function init(navigate) {
  rootNav = navigate;
  
  // Fake zones if offline
  state.liveZones = simulateTick();

  listenZones((z) => {
    if (Object.keys(z).length > 0) state.liveZones = z;
    if (state.screen === 'plan') updateView(); // re-render live pills
  });

  listenNudges((n) => {
    state.nudges = n || [];
    if (state.screen === 'during' && n.length > 0) updateView();
  });

  bindEvents();
}
