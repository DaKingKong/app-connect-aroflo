const { createCoreApp, connectorRegistry } = require('@app-connect/core');
const developerPortal = require('@app-connect/core/connector/developerPortal');

const arofloConnector = require('./connectors/aroflo');
const manifest = require('./connectors/manifest.json');
const releaseNotes = require('./releaseNotes.json');

const appServer = (process.env.APP_SERVER || process.env.OVERRIDE_APP_SERVER || '').replace(/\/+$/, '');
if (appServer) {
  manifest.serverUrl = appServer;
  if (Array.isArray(manifest.platforms)) {
    manifest.platforms.forEach((platform) => {
      platform.serverUrl = appServer;
    });
  }
}

connectorRegistry.setDefaultManifest(manifest);
connectorRegistry.registerConnector('AroFlo', arofloConnector, manifest);
connectorRegistry.setReleaseNotes(releaseNotes);

// The hosted Developer Portal manifest lookup can fail before falling back to
// connectorRegistry because @app-connect/core@1.7.35 imports its logger
// incorrectly in connector/developerPortal.js. This server only hosts AroFlo,
// so resolve managed auth fields from the local manifest directly.
developerPortal.getConnectorManifest = async function getConnectorManifestFromLocal() {
  return manifest;
};

const app = createCoreApp();

app.get('/', (req, res) => {
  res.send('AroFlo App Connect Connector Server - OK');
});

app.get('/is-alive', (req, res) => {
  res.send('OK');
});

exports.app = app;