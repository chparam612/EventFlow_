/**
 * EventFlow V2 — Map Controller
 * Encapsulates Google Maps initialization and overlay management.
 */

import { ZONES, getZoneStatus } from '/src/simulation.js';
import { calculateDensityColor } from '/src/heatmapEngine.js';

// NMS approximate bounding coords for each zone overlay
export const ZONE_BOUNDS = {
  north:   { n: 23.0945, s: 23.0930, e: 72.6000, w: 72.5970 },
  south:   { n: 23.0910, s: 23.0895, e: 72.6000, w: 72.5970 },
  east:    { n: 23.0932, s: 23.0910, e: 72.6015, w: 72.5995 },
  west:    { n: 23.0932, s: 23.0910, e: 72.5975, w: 72.5955 },
  concN:   { n: 23.0938, s: 23.0930, e: 72.5995, w: 72.5975 },
  concS:   { n: 23.0918, s: 23.0910, e: 72.5995, w: 72.5975 },
  gates:   { n: 23.0945, s: 23.0940, e: 72.5990, w: 72.5980 },
  parking: { n: 23.0965, s: 23.0950, e: 72.6025, w: 72.5955 }
};

let mapInstance = null;
let zoneRectangles = {};
let lastDensities = {};
let heatmapLayer = null;

/**
 * Initialize the Google Map for the Control Room
 */
export function initMap(mapEl, initialDensities = {}) {
  if (!mapEl || !window.google?.maps) return null;
  lastDensities = initialDensities;

  mapInstance = new window.google.maps.Map(mapEl, {
    center: { lat: 23.0918, lng: 72.5976 },
    zoom: 17,
    mapId: 'e4b9db3073df26e8', // Modern Map ID
    mapTypeId: 'satellite',
    disableDefaultUI: false,
    zoomControl: true,
    tilt: 0
  });

  // Initialize Heatmap Layer
  if (window.google.maps.visualization) {
    heatmapLayer = new window.google.maps.visualization.HeatmapLayer({
      data: [],
      map: mapInstance,
      radius: 40,
      opacity: 0.8
    });
  }

  const mapBounds = new window.google.maps.LatLngBounds();

  // Draw zone rectangles (Structural layer)
  Object.entries(ZONE_BOUNDS).forEach(([id, bounds]) => {
    mapBounds.extend({ lat: bounds.n, lng: bounds.e });
    mapBounds.extend({ lat: bounds.s, lng: bounds.w });
    
    const rect = new window.google.maps.Rectangle({
      bounds: { north: bounds.n, south: bounds.s, east: bounds.e, west: bounds.w },
      fillColor: 'transparent', // Rects are now for interaction, Heatmap for color
      fillOpacity: 0,
      strokeColor: 'rgba(255,255,255,0.2)',
      strokeWeight: 1,
      map: mapInstance
    });

    const infoWindow = new window.google.maps.InfoWindow();
    rect.addListener('click', (e) => {
      infoWindow.setContent(`
        <div style="font-family:'Space Grotesk',sans-serif;padding:4px 2px;">
          <b>${ZONES[id]?.name || id}</b><br>
          Density: ${Math.round((lastDensities[id] || 0) * 100)}%<br>
          Status: ${getZoneStatus(lastDensities[id] || 0)}
        </div>`);
      infoWindow.setPosition(e.latLng);
      infoWindow.open(mapInstance);
    });

    zoneRectangles[id] = rect;
  });

  // ... (Markers logic below)

  // Gate labels A–H around stadium (using AdvancedMarkerElement)
  const gatePositions = [
    { label: 'A', lat: 23.0952, lng: 72.5975 },
    { label: 'B', lat: 23.0952, lng: 72.5988 },
    { label: 'C', lat: 23.0938, lng: 72.6008 },
    { label: 'D', lat: 23.0921, lng: 72.6015 },
    { label: 'E', lat: 23.0902, lng: 72.6008 },
    { label: 'F', lat: 23.0921, lng: 72.5955 },
    { label: 'G', lat: 23.0890, lng: 72.5988 },
    { label: 'H', lat: 23.0890, lng: 72.5975 }
  ];

  gatePositions.forEach(g => {
    const pinEl = document.createElement('div');
    pinEl.style.cssText = `
      width:22px;height:22px;border-radius:50%;
      background:#131C2E;border:1px solid rgba(255,255,255,0.3);
      display:flex;align-items:center;justify-content:center;
      color:#F0F4F8;font-size:11px;font-weight:700;
      font-family:'Space Grotesk',sans-serif;
    `;
    pinEl.textContent = g.label;
    pinEl.setAttribute('title', 'Gate ' + g.label);

    new window.google.maps.marker.AdvancedMarkerElement({
      position: { lat: g.lat, lng: g.lng },
      map: mapInstance,
      content: pinEl,
      title: 'Gate ' + g.label
    });
  });

  mapInstance.fitBounds(mapBounds);
  return mapInstance;
}

/**
 * Update Map Overlays based on new density data
 */
export function updateMapOverlays(densitiesData, predictions = {}, emergency = { active: false }, heatmapEnabled = true) {
  if (!densitiesData) densitiesData = {};
  lastDensities = densitiesData;
  
  const heatmapData = [];

  Object.entries(zoneRectangles).forEach(([id, rect]) => {
    const d = densitiesData[id] || 0;
    const pred = predictions[id]?.risk && predictions[id]?.percent >= 90;
    const isBlocked = emergency.active && emergency.zone === id;
    
    // ── Update Rectangle Visuals (Stroke & Interaction) ──
    const strokeColor = isBlocked ? '#000000' : (pred ? '#A29BFE' : 'rgba(255,255,255,0.3)');
    rect.setOptions({ 
      strokeColor,
      strokeWeight: isBlocked ? 4 : 1
    });

    // ── Data Generation for Heatmap ──
    if (heatmapEnabled && !isBlocked) {
      const bounds = ZONE_BOUNDS[id];
      if (bounds) {
        // Number of points represents density
        const numPoints = Math.floor(d * 25); 
        for (let i = 0; i < numPoints; i++) {
          const lat = bounds.s + Math.random() * (bounds.n - bounds.s);
          const lng = bounds.w + Math.random() * (bounds.e - bounds.w);
          heatmapData.push({
            location: new window.google.maps.LatLng(lat, lng),
            weight: d * 1.2 // Tuning weight for smoother "glow" without over-saturation
          });
        }
      }
    }
  });

  // Update heatmap layer
  if (heatmapLayer) {
    heatmapLayer.setData(heatmapData);
    heatmapLayer.setMap(heatmapEnabled ? mapInstance : null);
  }
}
