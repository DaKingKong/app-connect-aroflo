const {
    connectorError,
    getZone,
} = require('../arofloClient');

async function refreshUserInfo({ user, authHeader }) {
    try {
        await getZone({ user, authHeader }, [
            ['zone', 'users'],
            ['page', '1'],
            ['pageSize', '1'],
        ]);

        return {
            successful: true,
            returnMessage: {
                messageType: 'success',
                message: 'User info refreshed',
                ttl: 1000
            }
        };
    }
    catch (e) {
        return {
            successful: false,
            returnMessage: {
                messageType: 'warning',
                message: 'Could not refresh AroFlo session. Please reconnect.',
                details: [
                    {
                        title: 'Details',
                        items: [
                            {
                                id: '1',
                                type: 'text',
                                text: connectorError('AroFlo user refresh', e)
                            }
                        ]
                    }
                ],
                ttl: 5000
            }
        };
    }
}

module.exports = refreshUserInfo;