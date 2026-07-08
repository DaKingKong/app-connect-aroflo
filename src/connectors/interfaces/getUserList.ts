const {
    connectorError,
    extractRecords,
    findFirstField,
    getZone,
} = require('../arofloClient');

// Used to get user list for server-side call logging user mapping.
async function getUserList({ user, authHeader }) {
    try {
        const data = await getZone({ user, authHeader }, [
            ['zone', 'users'],
            ['page', '1'],
            ['pageSize', '500'],
        ]);
        return extractRecords(data, ['user', 'users']).map((record) => {
            const firstName = findFirstField(record, ['givennames', 'givenNames', 'firstname', 'firstName']);
            const surname = findFirstField(record, ['surname', 'lastname', 'lastName']);
            return {
                id: findFirstField(record, ['userid', 'userId', 'id']),
                name: [firstName, surname].filter(Boolean).join(' ') || findFirstField(record, ['name', 'username', 'email']),
                email: findFirstField(record, ['email'])
            };
        }).filter((mappedUser) => mappedUser.id || mappedUser.name || mappedUser.email);
    }
    catch (e) {
        console.warn(connectorError('AroFlo user list lookup', e));
        return [];
    }
}

module.exports = getUserList;
