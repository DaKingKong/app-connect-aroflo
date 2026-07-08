const {
    connectorError,
    contactPhoneSearchEntries,
    extractRecords,
    getContactClientId,
    getZone,
    mapContact,
    phoneMatches,
    phoneSearchValues,
} = require('../arofloClient');

function ensureAdditionalInfoClientId(contact) {
    contact.additionalInfo = contact.additionalInfo || {};
    contact.additionalInfo.clientId = getContactClientId(contact) || '';
    return contact;
}

async function findContact({ user, authHeader, phoneNumber, overridingFormat, isExtension }) {
    try {
        const matchedContactInfo = [];
        const seen = new Set();
        const authInput = { user, authHeader };

        for (const phone of phoneSearchValues(phoneNumber)) {
            const data = await getZone(authInput, contactPhoneSearchEntries(phone));
            const records = extractRecords(data, ['contact', 'contacts']);
            for (const record of records) {
                if (!phoneMatches(record, phoneNumber)) {
                    continue;
                }
                const contact = ensureAdditionalInfoClientId(mapContact(record, phoneNumber));
                if (!seen.has(contact.id)) {
                    seen.add(contact.id);
                    matchedContactInfo.push(contact);
                }
            }
            if (matchedContactInfo.length > 0) {
                break;
            }
        }

        const contactCount = matchedContactInfo.length;
        matchedContactInfo.push({
            id: 'createNewContact',
            name: 'Create new contact...',
            type: 'Contact',
            additionalInfo: null,
            isNewContact: true
        });

        return {
            successful: true,
            matchedContactInfo,
            returnMessage: {
                messageType: 'success',
                message: `Found ${contactCount} AroFlo contact(s).`,
                ttl: 3000
            }
        };
    }
    catch (e) {
        return {
            successful: false,
            matchedContactInfo: [],
            returnMessage: {
                messageType: 'warning',
                message: 'Could not search AroFlo contacts.',
                details: [
                    {
                        title: 'Details',
                        items: [
                            {
                                id: '1',
                                type: 'text',
                                text: connectorError('AroFlo contact lookup', e)
                            }
                        ]
                    }
                ],
                ttl: 3000
            }
        };
    }
}

module.exports = findContact;