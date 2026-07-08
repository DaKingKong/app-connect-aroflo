const {
    connectorError,
    createClientNote,
    encodeLogId,
    getContactClientIdWithCache,
    normalizeCredentials,
} = require('../arofloClient');

// callLog: same as in https://developers.ringcentral.com/api-reference/Call-Log/readUserCallRecord
async function createCallLog({ user, contactInfo, authHeader, callLog, note, additionalSubmission, aiNote, transcript, composedLogDetails }) {
    try {
        const authInput = { user, authHeader };
        const credentials = normalizeCredentials(authInput);
        const clientId = await getContactClientIdWithCache({ user, contactInfo });

        if (!clientId) {
            return {
                logId: '',
                returnMessage: {
                    message: 'AroFlo call log was not created.',
                    messageType: 'warning',
                    details: [
                        {
                            title: 'Details',
                            items: [
                                {
                                    id: '1',
                                    type: 'text',
                                    text: 'The matched contact did not include an AroFlo clientid, which is required to create a ClientNotes entry.'
                                }
                            ]
                        }
                    ],
                    ttl: 3000
                }
            };
        }

        const subject = callLog?.customSubject || `[Call] ${callLog?.direction || ''} call ${contactInfo?.name ? `with ${contactInfo.name}` : ''}`.trim();
        const content = [
            subject,
            composedLogDetails || note,
        ].filter(Boolean).join('\n\n');

        const { noteId } = await createClientNote(authInput, {
            clientId,
            content,
            filter: credentials.noteFilter,
            sticky: credentials.noteSticky,
        });

        return {
            logId: encodeLogId({ type: 'clientnote', clientId, noteId: noteId || '' }),
            returnMessage: {
                message: 'Call logged to AroFlo.',
                messageType: 'success',
                ttl: 2000
            }
        };
    }
    catch (e) {
        return {
            logId: '',
            returnMessage: {
                message: 'AroFlo call log was not created.',
                messageType: 'warning',
                details: [
                    {
                        title: 'Details',
                        items: [
                            {
                                id: '1',
                                type: 'text',
                                text: connectorError('AroFlo call logging', e)
                            }
                        ]
                    }
                ],
                ttl: 3000
            }
        }
    }
}

module.exports = createCallLog;
