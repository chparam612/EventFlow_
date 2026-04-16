export const ZONES = {
  north:   { name: 'North Stand',       cap: 35000 },
  south:   { name: 'South Stand',       cap: 35000 },
  east:    { name: 'East Stand',        cap: 25000 },
  west:    { name: 'West Stand',        cap: 25000 },
  concN:   { name: 'North Concourse',   cap: 6000  },
  concS:   { name: 'South Concourse',   cap: 6000  },
  gates:   { name: 'Gate Area',         cap: 4000  },
  parking: { name: 'Parking Zone',      cap: 8000  }
};

const TIMELINE = [
  { t: 0,   event: 'gates_open',      loads: {gates:0.7, parking:0.4, concN:0.2, concS:0.2} },
  { t: 60,  event: 'match_start',     loads: {north:0.7, south:0.7, east:0.6, west:0.6, gates:0.3} },
  { t: 90,  event: 'settled',         loads: {north:0.85, south:0.85, east:0.75, west:0.75} },
  { t: 240, event: 'innings_break',   loads: {concN:0.9, concS:0.88, gates:0.7} },
  { t: 270, event: 'innings_settled', loads: {concN:0.5, concS:0.5} },
  { t: 420, event: 'match_end',       loads: {gates:0.95, parking:0.9, concN:0.8, concS:0.8} },
  { t: 450, event: 'crowd_clearing',  loads: {gates:0.5, parking:0.6} },
  { t: 480, event: 'empty',           loads: {north:0.1, south:0.1, east:0.1, west:0.1, gates:0.1, parking:0.1} }
];

let currentTick = 0; // minutes from 18:00
let staffOverrides = {}; // {zoneId: 'clear'|'crowded'}

export function setTick(minutes) { currentTick = minutes; }
export function getTick() { return currentTick; }

export function setStaffOverride(zoneId, status) {
  staffOverrides[zoneId] = status;
}

export function getZoneDensity() {
  let loads = {};
  for (const event of TIMELINE) {
    if (currentTick >= event.t) {
      loads = { ...loads, ...event.loads };
    }
  }
  
  const result = {};
  for (const [id, zone] of Object.entries(ZONES)) {
    let base = loads[id] || 0.15;
    if (staffOverrides[id] === 'crowded') base = Math.min(1, base * 1.35);
    if (staffOverrides[id] === 'clear') base = Math.max(0, base * 0.65);
    const noise = (Math.random() - 0.5) * 0.04;
    result[id] = Math.max(0, Math.min(1, base + noise));
  }
  return result;
}

export function getZoneStatus(density) {
  if (density >= 0.8) return 'critical';
  if (density >= 0.6) return 'busy';
  return 'clear';
}

export function getStatusColor(status) {
  if (status === 'critical') return '#FF4757';
  if (status === 'busy') return '#FFD166';
  return '#00C49A';
}

export function getRecommendedGate(section, density) {
  const gateMap = { north: 'B', south: 'G', east: 'D', west: 'F' };
  const altMap =  { north: 'A', south: 'H', east: 'C', west: 'E' };
  const primary = gateMap[section] || 'B';
  const alt = altMap[section] || 'A';
  const d = density[section] || 0;
  return d > 0.75 ? alt : primary;
}

export function getExitPlan(section, transport, density) {
  const gateMap = { north: 'B', south: 'G', east: 'D', west: 'F' };
  const gate = gateMap[section] || 'B';
  const now = density[section] || 0.5;
  return [
    {
      id: 'now', label: 'Leave Now',
      gate, eta: now > 0.7 ? 18 : 5,
      density: now, note: 'Best if you want to avoid the rush'
    },
    {
      id: 'wait15', label: 'Wait 15 Minutes',
      gate, eta: 7,
      density: Math.max(0.2, now - 0.25),
      note: 'Crowd settles significantly in 15 min'
    },
    {
      id: 'stay', label: 'Stay for Ceremony',
      gate, eta: 6,
      density: 0.2, note: 'Smoothest exit, see the full presentation'
    }
  ];
}

export function simulateTick() {
  currentTick = Math.min(currentTick + 1, 480);
  return getZoneDensity();
}
