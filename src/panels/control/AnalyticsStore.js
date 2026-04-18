/**
 * EventFlow V2 — Analytics Store
 * Manages crowd metrics and dashboard visualization.
 */

import { ZONES } from '/src/simulation.js';
import { 
  calculateTotalVisitors, 
  calculateAverageDensity, 
  findPeakZone, 
  calculateGateUtilization, 
  estimateAverageWaitTime 
} from '/src/analyticsEngine.js';

/**
 * Update the global metrics and analytics dashboard
 */
export function updateAnalytics(densities, currentEmergency = { active: false }) {
  if (!densities) return;
  
  const vals = Object.values(densities);
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  
  // Basic Metrics
  const totalEl = document.getElementById('ctrl-total');
  const metricAvg = document.getElementById('metric-avg');
  
  const enrichedZones = Object.entries(densities).map(([id, d]) => {
    const zDef = ZONES[id] || {};
    return {
      id,
      capacity: zDef.cap || 10000,
      currentFans: Math.round(d * (zDef.cap || 10000)),
      exitRate: zDef.exitRate || 20
    };
  });

  const totalFans = calculateTotalVisitors(enrichedZones);
  const avgDens = calculateAverageDensity(enrichedZones);
  const peak = findPeakZone(enrichedZones);
  const gates = calculateGateUtilization(enrichedZones);
  const avgWait = estimateAverageWaitTime(enrichedZones);

  // Update DOM Basic
  if (totalEl) totalEl.textContent = totalFans.toLocaleString('en-IN');
  if (metricAvg) metricAvg.textContent = Math.round(avg * 100) + '%';

  // Update Cards
  updateAnalyticsCards(totalFans, avgDens, peak, gates, avgWait, currentEmergency);
}

function updateAnalyticsCards(totalFans, avgDens, peak, gates, avgWait, currentEmergency) {
  if (!document.getElementById('analytics-total')) return;

  document.getElementById('analytics-total').textContent = totalFans.toLocaleString('en-IN');
  
  const avgCard = document.getElementById('analytics-avg-card');
  const avgEl = document.getElementById('analytics-avg');
  if (avgEl) {
    avgEl.textContent = avgDens + '%';
    avgEl.style.color = avgDens > 85 ? '#FF4757' : (avgDens > 60 ? '#FFD166' : '#00C49A');
  }
  if (avgCard) {
    avgCard.style.border = avgDens > 85 ? '1px solid #FF4757' : (avgDens > 60 ? '1px solid #FFD166' : '1px solid #00C49A');
  }

  const peakCard = document.getElementById('analytics-peak-card');
  const peakEl = document.getElementById('analytics-peak');
  const emergAlert = document.getElementById('analytics-emerg-alert');
  const peakName = ZONES[peak.zoneId]?.name?.replace(' Stand','') || peak.zoneId || '--';
  
  if (peakEl) {
    peakEl.textContent = peak.zoneId ? `${peakName} (${peak.densityPercent}%)` : '--';
    if (currentEmergency.active) {
      peakEl.style.color = '#FF4757';
      if (!(currentEmergency.zone === peak.zoneId || avgDens > 85)) {
        peakEl.textContent = `${ZONES[currentEmergency.zone]?.name} (BLOCKED)`;
      }
    } else {
      peakEl.style.color = peak.densityPercent > 85 ? '#FF4757' : 'var(--text-primary)';
    }
  }

  if (peakCard) {
    peakCard.style.border = (currentEmergency.active || peak.densityPercent > 85) ? '1px solid #FF4757' : '1px solid var(--border)';
  }
  if (emergAlert) {
    emergAlert.style.display = currentEmergency.active ? 'block' : 'none';
  }

  const gatesEl = document.getElementById('analytics-gates');
  if (gatesEl) {
    const mainGates = gates.filter(g => ['north','south','east','west'].includes(g.zoneId));
    gatesEl.innerHTML = mainGates.map(g => {
       const color = g.utilizationPercent > 85 ? '#FF4757' : (g.utilizationPercent > 60 ? '#FFD166' : '#00C49A');
       const n = ZONES[g.zoneId]?.name?.replace(' Stand','') || g.zoneId;
       return `<div style="display:flex;justify-content:space-between;">
           <span>${n}</span>
           <span style="color:${color};">${g.utilizationPercent}%</span>
         </div>`;
    }).join('');
  }

  const waitEl = document.getElementById('analytics-wait');
  if (waitEl) waitEl.textContent = `${avgWait} min`;
}

/**
 * Render surge risk alerts based on predictions
 */
export function renderPredictiveAlerts(predictions) {
  const el = document.getElementById('predictive-alerts');
  if (!el) return;
  const risky = Object.entries(predictions).filter(([, p]) => p.risk);
  if (risky.length === 0) {
    el.innerHTML = '<div style="color:var(--text-muted);font-size:0.8rem;">No surges predicted</div>';
    return;
  }
  el.innerHTML = risky.map(([id, p]) => {
    const name = ZONES[id]?.name || id;
    const color = p.level === 'HIGH' ? '#A29BFE' : '#FFD166';
    return `
      <div style="background:rgba(162,155,254,0.08);border:1px solid ${color}44;
        border-radius:10px;padding:10px 12px;">
        <div style="font-size:0.75rem;font-weight:600;color:${color};margin-bottom:3px;">
          ⚠️ Surge Risk: ${p.level}</div>
        <div style="font-size:0.8rem;color:var(--text-primary);margin-bottom:4px;">
          ${name} predicted at ${p.percent}% in 10m</div>
      </div>`;
  }).join('');
}
