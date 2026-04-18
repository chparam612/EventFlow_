const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

/**
 * FUNCTION 1 — Zone Alert Trigger
 * Automatically fires when a zone density exceeds 80% in Firebase database.
 */
exports.zoneAlertTrigger = 
  functions.database
    .ref('/zones/{zoneId}')
    .onWrite((change, context) => {
      const data = change.after.val();
      if (!data) return null;
      
      const density = data.density || 0;
      const zoneId = context.params.zoneId;
      
      if (density > 80) {
        console.log(
          `ALERT: ${zoneId} at ${density}%`
        );
        return admin.database()
          .ref('/alerts/' + zoneId)
          .set({
            zone: zoneId,
            density: density,
            timestamp: Date.now(),
            level: density > 90 ? 
              'CRITICAL' : 'WARNING'
          });
      }
      return null;
    });

/**
 * FUNCTION 2 — Emergency Broadcast
 * Triggered when emergency is activated.
 */
exports.emergencyBroadcast = 
  functions.database
    .ref('/emergency/status')
    .onWrite((change, context) => {
      const data = change.after.val();
      if (!data || !data.active) return null;
      
      console.log(
        'Emergency activated:', data.type
      );
      
      return admin.database()
        .ref('/nudges/emergency')
        .set({
          message: 
            '🚨 Emergency: Avoid ' + 
            data.zone + '. Follow staff.',
          timestamp: Date.now(),
          priority: 'HIGH'
        });
    });

/**
 * FUNCTION 3 — BigQuery Telemetry Sync (Simulation)
 * Triggered by Firestore telemetry additions to demonstrate
 * the Google Cloud data pipeline (Service #8: BigQuery).
 */
exports.bigQueryTelemetrySync = 
  functions.firestore
    .document('telemetry/{docId}')
    .onCreate((snap, context) => {
      const data = snap.data();
      // In a real production setup, we would use @google-cloud/bigquery
      // to stream this record into a regional dataset.
      console.log('--- BIGQUERY STREAMING SYNC ---');
      console.log(`Syncing Event: ${data.event} | Peak: ${data.peakDensity}%`);
      console.log('Destination: eventflow_analytics.telemetry_raw');
      return null;
    });
