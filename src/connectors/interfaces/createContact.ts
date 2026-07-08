const {
    connectorError,
    createClientContact,
    getOrCreatePlaceholderClient,
} = require('../arofloClient');

async function createContact({ user, authHeader, phoneNumber, newContactName, newContactType }) {
    try {
        const authInput = { user, authHeader };
        const contactType = newContactType || 'Contact';
        const clientId = (await getOrCreatePlaceholderClient(authInput)).clientId;

        const { contact } = await createClientContact(authInput, {
            clientId,
            name: newContactName,
            phoneNumber,
        });

        return {
            contactInfo: {
                ...contact,
                type: contact.type || contactType,
            },
            returnMessage: {
                message: `Contact created in AroFlo.`,
                messageType: 'success',
                ttl: 2000
            }
        }
    }
    catch (e) {
        return {
            contactInfo: null,
            returnMessage: {
                message: 'AroFlo contact was not created.',
                messageType: 'warning',
                details: [
                    {
                        title: 'Details',
                        items: [
                            {
                                id: '1',
                                type: 'text',
                                text: connectorError('AroFlo contact creation', e)
                            }
                        ]
                    }
                ],
                ttl: 3000
            }
        }
    }
}

module.exports = createContact;