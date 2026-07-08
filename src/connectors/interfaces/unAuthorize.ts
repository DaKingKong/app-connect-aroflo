async function unAuthorize({ user }) {
    user.accessToken = '';
    user.refreshToken = '';
    if (user.platformAdditionalInfo) {
        user.platformAdditionalInfo = {};
    }
    await user.save();

    return {
        returnMessage: {
            messageType: 'success',
            message: 'Logged out of AroFlo.',
            ttl: 1000
        }
    }
}

module.exports = unAuthorize;
