/**
 * EventFlow V2 — Telemetry Pipeline
 * Handles typed errors and sends performance/simulation metrics to Firestore.
 */

import { sendTelemetry } from './firebase.js';

export class EventFlowError extends Error {
  constructor(category, message, data = {}) {
    super(message);
    this.name = 'EventFlowError';
    this.category = category;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Log a simulation event to Firestore telemetry
 * @param {string} eventName 
 * @param {object} payload 
 */
export async function trackEvent(eventName, payload = {}) {
  const entry = {
    event: eventName,
    ...payload,
    userAgent: navigator.userAgent,
    url: window.location.href
  };

  // Structured Log (JSON)
  console.log(JSON.stringify({ 
    timestamp: new Date().toISOString(), 
    level: 'info', 
    message: `Telemetry: ${eventName}`, 
    data: entry 
  }));

  // Persistent Cloud Storage (Firestore)
  return sendTelemetry(entry);
}

/**
 * Track a peak density event for BigQuery analysis
 * @param {string} zoneId 
 * @param {number} density 
 */
export async function trackPeak(zoneId, density) {
  if (density < 0.8) return; // Only track significant peaks
  return trackEvent('DENSITY_PEAK', {
    zoneId,
    peakDensity: Math.round(density * 100)
  });
}
