const {
    connectorError,
    decodeLogId,
    normalizeCredentials,
    updateClientNote,
} = require('../arofloClient');

function syncSubjectHeader(content, subject) {
    if (!subject || !content) {
        return content || subject || '';
    }

    const body = String(content);
    const parts = body.split(/\r?\n\s*\r?\n/);
    if (parts.length > 1) {
        return [subject, ...parts.slice(1)].join('\n\n');
    }
    if (body.trim().startsWith('- ')) {
        return `${subject}\n\n${body}`;
    }
    return body;
}

// - note: note submitted by user
// - subject: subject submitted by user
// - startTime: more accurate startTime will be patched to this update function shortly after the call ends
// - duration: more accurate duration will be patched to this update function shortly after the call ends
// - result: final result will be patched to this update function shortly after the call ends
// - recordingLink: recordingLink updated from RingCentral. It's separated from createCallLog because recordings are not generated right after a call. It needs to be updated into existing call log
async function updateCallLog({ user, existingCallLog, authHeader, recordingLink, subject, note, startTime, duration, result, aiNote, transcript, composedLogDetails, existingCallLogDetails }) {
    try {
        const authInput = { user, authHeader };
        const credentials = normalizeCredentials(authInput);
        const decoded = decodeLogId(existingCallLog?.thirdPartyLogId);
        if (!decoded?.clientId || !decoded?.noteId) {
            return {
                updatedNote: note,
                returnMessage: {
                    message: 'AroFlo call log could not be updated.',
                    messageType: 'warning',
                    details: [
                        {
                            title: 'Details',
                            items: [
                                {
                                    id: '1',
                                    type: 'text',
                                    text: 'The saved App Connect log id does not contain an editable AroFlo ClientNote id.'
                                }
                            ]
                        }
                    ],
                    ttl: 3000
                }
            };
        }

        const content = syncSubjectHeader(composedLogDetails || note || subject || '', subject);
        await updateClientNote(authInput, {
            clientId: decoded.clientId,
            clientNoteId: decoded.noteId,
            content,
            filter: credentials.noteFilter,
            sticky: credentials.noteSticky,
        });

        return {
            updatedNote: note,
            returnMessage: {
                message: 'Call log updated in AroFlo.',
                messageType: 'success',
                ttl: 2000
            }
        };
    }
    catch (e) {
        return {
            updatedNote: note,
            returnMessage: {
                message: 'AroFlo call log could not be updated.',
                messageType: 'warning',
                details: [
                    {
                        title: 'Details',
                        items: [
                            {
                                id: '1',
                                type: 'text',
                                text: connectorError('AroFlo call log update', e)
                            }
                        ]
                    }
                ],
                ttl: 3000
            }
        }
    }
}

module.exports = updateCallLog;
