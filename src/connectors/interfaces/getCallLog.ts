const {
    connectorError,
    decodeLogId,
    extractRecords,
    findFirstField,
    getZone,
} = require('../arofloClient');

function findMatchingClientNote(records, decoded) {
    return records.find((record) => {
        const noteId = findFirstField(record, ['noteid', 'clientnoteid', 'clientNoteId', 'id']);
        const clientId = findFirstField(record, ['clientid', 'clientId']);
        return noteId === decoded.noteId && (!decoded.clientId || clientId === decoded.clientId);
    }) || records.find((record) => findFirstField(record, ['noteid', 'clientnoteid', 'clientNoteId', 'id']) === decoded.noteId) || null;
}

function extractPlainTextAgentNote(body) {
    const noteMatch = String(body || '').match(/- (?:Note|Agent notes): ([\s\S]*?)(?=\n- [A-Z][a-zA-Z\s/]*:|\n$|$)/);
    return noteMatch ? noteMatch[1].trim() : '';
}

function extractPlainTextSummary(body) {
    const summaryMatch = String(body || '').match(/- Summary: ([^\n]*)/);
    return summaryMatch ? summaryMatch[1].trim() : '';
}

function splitCallLogBody(body) {
    const fullBody = String(body || '');
    const parts = fullBody.split(/\r?\n\s*\r?\n/);
    if (parts.length <= 1) {
        return {
            subject: extractPlainTextSummary(fullBody),
            note: extractPlainTextAgentNote(fullBody) || fullBody,
            fullBody,
        };
    }

    const details = parts.slice(1).join('\n\n').trim();
    return {
        subject: extractPlainTextSummary(details) || parts[0].trim(),
        note: extractPlainTextAgentNote(details) || details,
        fullBody,
    };
}

function emptyCallLogInfo() {
    return {
        subject: '',
        note: '',
        fullBody: ''
    };
}

async function getCallLog({ user, callLogId, authHeader }) {
    try {
        const decoded = decodeLogId(callLogId);
        if (!decoded?.noteId) {
            return {
                callLogInfo: emptyCallLogInfo(),
                returnMessage: {
                    message: 'AroFlo call log could not be fetched.',
                    messageType: 'warning',
                    ttl: 3000
                }
            }
        }

        const entries = [
            ['zone', 'ClientNotes'],
            ['where', `and|noteid|=|${decoded.noteId}`],
        ];
        if (decoded.clientId) {
            entries.push(['where', `and|clientid|=|${decoded.clientId}`]);
        }
        entries.push(['page', '1']);
        entries.push(['pageSize', '20']);

        const data = await getZone({ user, authHeader }, entries);
        const records = extractRecords(data, ['clientnote', 'clientnotes', 'note', 'notes']);
        const record = findMatchingClientNote(records, decoded);
        if (!record) {
            return {
                callLogInfo: emptyCallLogInfo(),
                returnMessage: {
                    message: 'AroFlo call log could not be matched.',
                    messageType: 'warning',
                    ttl: 3000
                }
            }
        }

        const body = findFirstField(record, ['content', 'note', 'body']);

        return {
            callLogInfo: splitCallLogBody(body),
            returnMessage: {
                message: 'Call log fetched from AroFlo.',
                messageType: 'success',
                ttl: 3000
            }
        }
    }
    catch (e) {
        return {
            callLogInfo: emptyCallLogInfo(),
            returnMessage: {
                message: 'AroFlo call log could not be fetched.',
                messageType: 'warning',
                details: [
                    {
                        title: 'Details',
                        items: [
                            {
                                id: '1',
                                type: 'text',
                                text: connectorError('AroFlo call log fetch', e)
                            }
                        ]
                    }
                ],
                ttl: 3000
            }
        }
    }
}

module.exports = getCallLog;