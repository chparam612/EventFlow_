/**
 * EventFlow V2 — Evacuation Time Engine
 * Calculates real-time evacuation durations and ranks safe exits.
 */

/**
 * FUNCTION 1 — calculateEvacuationTime(zone)
 * Logic: time = currentFans / exitRate
 */
/**
 * Calculates the estimated time to clear a zone based on current occupancy and exit rate.
 * Logic: time = currentFans / exitRate
 * @param {object} zoneData - Data for the zone being calculated
 * @param {string} zoneData.id - Unique identifier for the zone
 * @param {number} [zoneData.currentFans=0] - Estimated number of fans currently in the zone
 * @param {number} [zoneData.exitRate=20] - Fans cleared per minute through exits
 * @param {boolean} [zoneData.blocked=false] - Whether the zone is completely inaccessible
 * @returns {{id: string, time: number, status: 'BLOCKED'|'ACTIVE'}}
 */
export function calculateEvacuationTime(zoneData) {
  const { id, currentFans = 0, exitRate = 20, blocked = false } = zoneData;

  if (blocked) {
    return {
      id,
      time: Infinity,
      status: "BLOCKED"
    };
  }

  // Prevent divide-by-zero
  const safeExitRate = exitRate > 0 ? exitRate : 20;
  const time = Math.ceil(currentFans / safeExitRate);

  return {
    id,
    time,
    status: "ACTIVE"
  };
}

/**
 * FUNCTION 2 — rankBestExit(zones, densities, blockedZoneId = null)
 * Logic: Sorts zones by evacuation time (lowest first)
 */
/**
 * Ranks all available stadium exits by their estimated evacuation time.
 * Logic: Sorts zones by calculated time (lowest first), moving blocked zones to the end.
 * @param {object} zones - Global zones configuration
 * @param {object} densities - Live crowd density percentages for all zones
 * @param {string|null} [blockedZoneId=null] - Optional ID of a zone that should be marked as blocked
 * @returns {{recommendedGate: string|null, rankedList: object[]}}
 */
export function rankBestExit(zones, densities, blockedZoneId = null) {
  const estimates = Object.entries(zones)
    .filter(([id]) => id !== 'parking' && id !== 'gates') // Exclude non-exit zones
    .map(([id, z]) => {
      const density = densities[id] || 0;
      const currentFans = density * (z.cap || 10000);
      const isBlocked = (id === blockedZoneId);
      
      return calculateEvacuationTime({
        id,
        currentFans,
        exitRate: z.exitRate || 20,
        blocked: isBlocked
      });
    });

  // Sort by time (Infinity/Blocked goes to end)
  const rankedList = estimates.sort((a, b) => a.time - b.time);
  
  const recommended = rankedList.find(e => e.status === "ACTIVE");

  return {
    recommendedGate: recommended ? recommended.id : null,
    rankedList
  };
}
