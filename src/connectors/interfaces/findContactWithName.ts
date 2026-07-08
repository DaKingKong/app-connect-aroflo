const {
    connectorError,
    extractRecords,
    getZone,
    mapContact,
} = require('../arofloClient');

async function findContactWithName({ user, authHeader, name }) {
    try {
        const nameParts = String(name || '').trim().split(/\s+/);
        const lastName = nameParts[nameParts.length - 1] || name;
        const data = await getZone({ user, authHeader }, [
            ['zone', 'contacts'],
            ['where', 'and|archived|=|false'],
            ['where', `and|surname|=|${lastName}`],
            ['page', '1'],
            ['pageSize', '20'],
        ]);
        const expected = String(name || '').toLowerCase();
        const matchedContactInfo = extractRecords(data, ['contact', 'contacts'])
            .map((record) => mapContact(record))
            .filter((contact) => contact.name.toLowerCase().includes(expected) || contact.name.toLowerCase().includes(lastName.toLowerCase()));

        return {
            matchedContactInfo,
            returnMessage: {
                message: `Found ${matchedContactInfo.length} AroFlo contact(s).`,
                messageType: 'success',
                ttl: 2000
            }
        }
    }
    catch (e) {
        return {
            matchedContactInfo: [],
            returnMessage: {
                message: 'Could not search AroFlo contacts by name.',
                messageType: 'warning',
                details: [
                    {
                        title: 'Details',
                        items: [
                            {
                                id: '1',
                                type: 'text',
                                text: connectorError('AroFlo contact name search', e)
                            }
                        ]
                    }
                ],
                ttl: 3000
            }
        }
    }
}

module.exports = findContactWithName;
