const {
    connectorError,
    extractRecords,
    findFirstField,
    getZone,
    normalizeCredentials,
} = require('../arofloClient');

async function getUserInfo({ authHeader, apiKey, additionalInfo }) {
    try {
        const authInput = { authHeader, apiKey, additionalInfo };
        const credentials = normalizeCredentials(authInput);
        const data = await getZone(authInput, [
            ['zone', 'users'],
            ['page', '1'],
            ['pageSize', '1'],
        ]);
        const userRecord = extractRecords(data, ['user', 'users'])[0] || {};

        const id = findFirstField(userRecord, ['userid', 'userId', 'id']) || credentials.uEncoded;
        const name = [
            findFirstField(userRecord, ['givennames', 'givenNames', 'firstname', 'firstName']),
            findFirstField(userRecord, ['surname', 'lastname', 'lastName'])
        ].filter(Boolean).join(' ') || findFirstField(userRecord, ['name', 'username', 'email']) || 'AroFlo User';

        return {
            successful: true,
            platformUserInfo: {
                id,
                name,
                timezoneName: '',
                timezoneOffset: null,
                platformAdditionalInfo: credentials
            },
            returnMessage: {
                messageType: 'success',
                message: 'Connected to AroFlo.',
                ttl: 1000
            }
        };
    }
    catch (e) {
        return {
            successful: false,
            returnMessage: {
                messageType: 'warning',
                message: 'Could not load AroFlo user information',
                details: [
                    {
                        title: 'Details',
                        items: [
                            {
                                id: '1',
                                type: 'text',
                                text: connectorError('AroFlo user validation', e)
                            }
                        ]
                    }
                ],
                ttl: 3000
            }
        }
    }
}

module.exports = getUserInfo;
