/**
 * EventFlow V2 — Predictive Crowd Surge Engine
 * Calculates future congestion levels 10 minutes ahead.
 */

/**
 * FUNCTION 1 — predictFutureDensity(zone)
 * Logic: futureFans = currentFans + (entryRate - exitRate) × 10
 */
/**
 * Calculate the predicted crowd density for a zone 10 minutes into the future.
 * Logic: futureFans = currentFans + (entryRate - exitRate) × 10
 * @param {object} zone - The zone data object
 * @param {number} [zone.entryRate=5] - Fans entering per minute
 * @param {number} [zone.exitRate=3] - Fans leaving per minute
 * @param {number} [zone.capacity=10000] - Total fan capacity of the zone
 * @param {number} [zone.currentFans=0] - Current number of fans in the zone
 * @returns {{futureFans: number, predictedPercent: number}}
 */
export function predictFutureDensity(zone) {
  const minutesAhead = 10;
  
  // Use requested defaults if rates are missing
  const entryRate = zone.entryRate !== undefined ? zone.entryRate : 5;
  const exitRate = zone.exitRate !== undefined ? zone.exitRate : 3;
  const capacity = zone.capacity || 10000;
  const currentFans = zone.currentFans || 0;

  // Linear prediction model
  let futureFans = currentFans + (entryRate - exitRate) * minutesAhead;

  // Boundary safety: never below 0, never above capacity
  futureFans = Math.max(0, Math.min(capacity, futureFans));

  const predictedPercent = (futureFans / capacity) * 100;

  return {
    futureFans,
    predictedPercent
  };
}

/**
 * FUNCTION 2 — detectSurgeRisk(predictedPercent)
 * Categorizes risk levels based on thresholds.
 */
/**
 * Categorizes risk levels based on predicted density thresholds.
 * @param {number} predictedPercent - The predicted density in percentage (0-100)
 * @returns {{risk: boolean, level: 'HIGH'|'MEDIUM'|'LOW', percent: number}}
 */
export function detectSurgeRisk(predictedPercent) {
  let risk = false;
  let level = "LOW";

  if (predictedPercent >= 90) {
    risk = true;
    level = "HIGH";
  } else if (predictedPercent >= 75) {
    risk = true;
    level = "MEDIUM";
  }

  return {
    risk,
    level,
    percent: Math.round(predictedPercent)
  };
}
