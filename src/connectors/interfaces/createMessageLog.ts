const {
    connectorError,
    createClientNote,
    encodeLogId,
    getContactClientIdWithCache,
    normalizeCredentials,
} = require('../arofloClient');

// message : same as in https://developers.ringcentral.com/api-reference/Message-Store/readMessage
async function createMessageLog({ user, contactInfo, authHeader, message, additionalSubmission, recordingLink, faxDocLink }) {
    try {
        const messageType = recordingLink ? 'Voicemail' : (faxDocLink ? 'Fax' : 'SMS');
        const authInput = { user, authHeader };
        const credentials = normalizeCredentials(authInput);
        const clientId = await getContactClientIdWithCache({ user, contactInfo });
        if (!clientId) {
            return {
                logId: '',
                returnMessage: {
                    message: 'AroFlo message log was not created.',
                    messageType: 'warning',
                    ttl: 3000
                }
            };
        }

        const from = message?.from?.phoneNumber || message?.from?.name || '';
        const to = message?.to?.[0]?.phoneNumber || message?.to?.[0]?.name || '';
        const content = [
            `[${messageType}] ${message?.direction || ''} ${messageType}`,
            from || to ? `From: ${from}\nTo: ${to}` : '',
            message?.subject || '',
            recordingLink ? `Recording: ${recordingLink}` : '',
            faxDocLink ? `Fax document: ${faxDocLink}` : '',
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
                message: 'Message logged to AroFlo.',
                messageType: 'success',
                ttl: 1000
            }
        };
    }
    catch (e) {
        return {
            logId: '',
            returnMessage: {
                message: 'AroFlo message log was not created.',
                messageType: 'warning',
                details: [
                    {
                        title: 'Details',
                        items: [
                            {
                                id: '1',
                                type: 'text',
                                text: connectorError('AroFlo message logging', e)
                            }
                        ]
                    }
                ],
                ttl: 3000
            }
        }
    }
}

module.exports = createMessageLog;
