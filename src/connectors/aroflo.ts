// AroFlo connector for RingCentral App Connect.
// AroFlo uses per-request HMAC-SHA512 signatures, implemented in arofloClient.ts.

exports.getAuthType = require('./interfaces/getAuthType');
exports.getLogFormatType = require('./interfaces/getLogFormatType');
exports.getBasicAuth = require('./interfaces/getBasicAuth');
exports.getUserInfo = require('./interfaces/getUserInfo');
exports.refreshUserInfo = require('./interfaces/refreshUserInfo');
exports.unAuthorize = require('./interfaces/unAuthorize');
exports.findContact = require('./interfaces/findContact');
exports.createCallLog = require('./interfaces/createCallLog');
exports.getCallLog = require('./interfaces/getCallLog');
exports.updateCallLog = require('./interfaces/updateCallLog');
exports.createMessageLog = require('./interfaces/createMessageLog');
exports.updateMessageLog = require('./interfaces/updateMessageLog');
exports.createContact = require('./interfaces/createContact');
exports.upsertCallDisposition = require('./interfaces/upsertCallDisposition');
exports.getUserList = require('./interfaces/getUserList');
exports.findContactWithName = require('./interfaces/findContactWithName');
