const {
    connectorError,
    decodeLogId,
    normalizeCredentials,
    updateClientNote,
} = require('../arofloClient');

async function updateMessageLog({ user, contactInfo, existingMessageLog, message, authHeader }) {
    try {
        const authInput = { user, authHeader };
        const credentials = normalizeCredentials(authInput);
        const decoded = decodeLogId(existingMessageLog?.thirdPartyLogId);
        if (!decoded?.clientId || !decoded?.noteId) {
            return {
                returnMessage: {
                    message: 'AroFlo message log could not be updated.',
                    messageType: 'warning',
                    ttl: 3000
                }
            };
        }

        const content = message?.subject || '';
        await updateClientNote(authInput, {
            clientId: decoded.clientId,
            clientNoteId: decoded.noteId,
            content,
            filter: credentials.noteFilter,
            sticky: credentials.noteSticky,
        });

        return {
            returnMessage: {
                message: 'Message log updated in AroFlo.',
                messageType: 'success',
                ttl: 2000
            }
        };
    }
    catch (e) {
        return {
            returnMessage: {
                message: 'AroFlo message log could not be updated.',
                messageType: 'warning',
                details: [
                    {
                        title: 'Details',
                        items: [
                            {
                                id: '1',
                                type: 'text',
                                text: connectorError('AroFlo message log update', e)
                            }
                        ]
                    }
                ],
                ttl: 3000
            }
        }
    }
}

module.exports = updateMessageLog;
