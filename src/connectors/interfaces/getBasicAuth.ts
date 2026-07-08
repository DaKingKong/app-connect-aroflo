// CHOOSE: If using apiKey auth
function getBasicAuth({ apiKey }) {
    // App Connect uses this for apiKey auth bootstrap. AroFlo requests are
    // signed separately per request in arofloClient.ts.
    return Buffer.from(`${apiKey}:`).toString('base64');
}

module.exports = getBasicAuth;
