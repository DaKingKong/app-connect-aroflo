async function upsertCallDisposition({ user, existingCallLog, authHeader, callDisposition }) {
    return {
        logId: existingCallLog?.thirdPartyLogId || ''
    }
}

module.exports = upsertCallDisposition;
