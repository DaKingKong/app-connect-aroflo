const axios = require('axios');
const crypto = require('crypto');

const DEFAULT_BASE_URL = 'https://api.aroflo.com/';
const DEFAULT_ACCEPT = 'text/json';
const DEFAULT_NOTE_FILTER = 'Internal Only';
const DEFAULT_NOTE_STICKY = false;
const DEFAULT_TIMEOUT_MS = 30000;
const DEFAULT_PLACEHOLDER_CLIENT_NAME = 'RingCentral App Connect Placeholder Client';
const DEFAULT_PLACEHOLDER_CLIENT_SHORT_NAME = 'RC App Connect';
const DEFAULT_PLACEHOLDER_CLIENT_PHONE = '0000000000';
const DEFAULT_PLACEHOLDER_CLIENT_MOBILE = '0400000000';
const DEFAULT_PLACEHOLDER_CLIENT_FAX = '0000000000';
const DEFAULT_PLACEHOLDER_CLIENT_EMAIL = 'app-connect-placeholder@example.com';
const DEFAULT_PLACEHOLDER_CLIENT_FIRST_NAME = 'RingCentral';
const DEFAULT_PLACEHOLDER_CLIENT_SURNAME = 'App Connect';
const DEFAULT_PLACEHOLDER_CLIENT_ABN = '00 000 000 000';
const DEFAULT_PLACEHOLDER_CLIENT_WEBSITE = 'example.com';
const DEFAULT_PLACEHOLDER_CLIENT_TERMS_NOTE = 'Created by RingCentral App Connect';
const DEFAULT_PLACEHOLDER_CLIENT_ADDRESS_LINE_1 = 'Created by RingCentral App Connect';
const DEFAULT_PLACEHOLDER_CLIENT_ADDRESS_LINE_2 = 'Placeholder Client';
const DEFAULT_PLACEHOLDER_CLIENT_SUBURB = 'Placeholder';
const DEFAULT_PLACEHOLDER_CLIENT_STATE = 'VIC';
const DEFAULT_PLACEHOLDER_CLIENT_POSTCODE = '3000';
const DEFAULT_PLACEHOLDER_CLIENT_COUNTRY = 'Australia';

function firstValue(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }
  return '';
}

function boolValue(value, fallback = false) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  return ['true', '1', 'yes', 'y'].includes(String(value).trim().toLowerCase());
}

function getCaseInsensitive(source, names) {
  if (!source || typeof source !== 'object') {
    return '';
  }
  const entries = Object.entries(source);
  for (const name of names) {
    const exact = source[name];
    if (exact !== undefined && exact !== null && String(exact).trim() !== '') {
      return String(exact).trim();
    }
    const normalized = name.toLowerCase();
    const found = entries.find(([key, value]) => key.toLowerCase() === normalized && value !== undefined && value !== null && String(value).trim() !== '');
    if (found) {
      return String(found[1]).trim();
    }
  }
  return '';
}

function decodeBasicAuthSecret(authHeader) {
  if (!authHeader || typeof authHeader !== 'string') {
    return '';
  }

  const headerValue = authHeader.replace(/^basic\s+/i, '').trim();
  try {
    const decoded = Buffer.from(headerValue, 'base64').toString('utf8');
    return decoded.split(':')[0] || '';
  }
  catch (e) {
    return '';
  }
}

function credentialSources(input: any = {}) {
  const user = input.user || {};
  return [
    input,
    input.additionalInfo,
    user.platformAdditionalInfo,
    user.additionalInfo,
    user.thirdPartyUserInfo?.platformAdditionalInfo,
    user.thirdPartyUserInfo?.additionalInfo,
    user.platformUserInfo?.platformAdditionalInfo,
    user,
  ].filter(Boolean);
}

function sourceValue(sources, names) {
  return firstValue(...sources.map((source) => getCaseInsensitive(source, names)));
}

function normalizeCredentials(input: any = {}) {
  const sources = credentialSources(input);
  const secretFromHeader = decodeBasicAuthSecret(input.authHeader);

  const secretKey = firstValue(
    input.apiKey,
    sourceValue(sources, ['apiKey', 'accessToken', 'secretKey', 'secret_key', 'apiSecretKey', 'arofloSecretKey']),
    secretFromHeader
  );

  const uEncoded = firstValue(
    sourceValue(sources, ['uEncoded', 'uencoded', 'u_encoded', 'userEncoded', 'arofloUEncoded']),
    process.env.AROFLO_U_ENCODED,
    process.env.ARO_FLO_U_ENCODED
  );

  const pEncoded = firstValue(
    sourceValue(sources, ['pEncoded', 'pencoded', 'p_encoded', 'passwordEncoded', 'arofloPEncoded']),
    process.env.AROFLO_P_ENCODED,
    process.env.ARO_FLO_P_ENCODED
  );

  const orgEncoded = firstValue(
    sourceValue(sources, ['orgEncoded', 'orgencoded', 'org_encoded', 'organizationEncoded', 'arofloOrgEncoded']),
    process.env.AROFLO_ORG_ENCODED,
    process.env.ARO_FLO_ORG_ENCODED
  );

  const hostIp = firstValue(
    sourceValue(sources, ['HostIP', 'hostIp', 'hostIP', 'host_ip', 'arofloHostIp']),
    process.env.AROFLO_HOST_IP,
    process.env.ARO_FLO_HOST_IP
  );

  const accept = firstValue(
    sourceValue(sources, ['accept', 'arofloAccept']),
    process.env.AROFLO_ACCEPT,
    process.env.ARO_FLO_ACCEPT,
    DEFAULT_ACCEPT
  );

  const baseUrl = firstValue(
    sourceValue(sources, ['baseUrl', 'apiUrl', 'hostname', 'arofloBaseUrl']),
    process.env.AROFLO_BASE_URL,
    process.env.ARO_FLO_BASE_URL,
    DEFAULT_BASE_URL
  );


  const noteFilter = firstValue(
    sourceValue(sources, ['noteFilter', 'arofloNoteFilter']),
    process.env.AROFLO_NOTE_FILTER,
    process.env.ARO_FLO_NOTE_FILTER,
    DEFAULT_NOTE_FILTER
  );

  const noteSticky = boolValue(firstValue(
    sourceValue(sources, ['noteSticky', 'arofloNoteSticky']),
    process.env.AROFLO_NOTE_STICKY,
    process.env.ARO_FLO_NOTE_STICKY
  ), DEFAULT_NOTE_STICKY);

  return {
    secretKey,
    uEncoded,
    pEncoded,
    orgEncoded,
    hostIp,
    accept,
    baseUrl,
    noteFilter,
    noteSticky,
  };
}

function requireCredentials(input: any = {}) {
  const credentials = normalizeCredentials(input);
  const missing = [];

  if (!credentials.secretKey) missing.push('apiKey');
  if (!credentials.uEncoded) missing.push('AROFLO_U_ENCODED / uEncoded');
  if (!credentials.pEncoded) missing.push('AROFLO_P_ENCODED / pEncoded');
  if (!credentials.orgEncoded) missing.push('AROFLO_ORG_ENCODED / orgEncoded');

  if (missing.length > 0) {
    throw new Error(`Missing AroFlo configuration: ${missing.join(', ')}`);
  }

  return credentials;
}

function normalizeBaseUrl(baseUrl) {
  return baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
}

function buildVarString(entries) {
  const parts = [];
  for (const [key, value] of entries) {
    if (value === undefined || value === null || value === '') {
      continue;
    }
    if (Array.isArray(value)) {
      for (const innerValue of value) {
        parts.push(`${key}=${encodeURIComponent(String(innerValue))}`);
      }
      continue;
    }
    parts.push(`${key}=${encodeURIComponent(String(value))}`);
  }
  return parts.join('&');
}

function buildAuthorization(credentials) {
  return [
    `uencoded=${encodeURIComponent(credentials.uEncoded)}`,
    `pencoded=${encodeURIComponent(credentials.pEncoded)}`,
    `orgEncoded=${encodeURIComponent(credentials.orgEncoded)}`,
  ].join('&');
}

function buildSignedHeaders({ credentials, method, varString, timestamp = undefined }: any) {
  const isoTimestamp = timestamp || new Date().toISOString();
  const authorization = buildAuthorization(credentials);
  const payload = [method.toUpperCase()];

  if (credentials.hostIp) {
    payload.push(credentials.hostIp);
  }

  payload.push('');
  payload.push(credentials.accept);
  payload.push(authorization);
  payload.push(isoTimestamp);
  payload.push(varString);

  const signature = crypto
    .createHmac('sha512', credentials.secretKey)
    .update(payload.join('+'))
    .digest('hex');

  const headers: any = {
    Authentication: `HMAC ${signature}`,
    Authorization: authorization,
    Accept: credentials.accept,
    afdatetimeutc: isoTimestamp,
  };

  if (credentials.hostIp) {
    headers.HostIP = credentials.hostIp;
  }

  return {
    headers,
    signature,
    authorization,
    timestamp: isoTimestamp,
    payload: payload.join('+'),
  };
}

function findFirstField(record, names) {
  if (!record || typeof record !== 'object') {
    return '';
  }

  const normalizedNames = names.map((name) => name.toLowerCase());
  for (const [key, value] of Object.entries(record)) {
    if (normalizedNames.includes(key.toLowerCase()) && value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }

  return '';
}

function extractStatus(data) {
  if (!data || typeof data !== 'object') {
    return { status: '', message: '' };
  }

  const status = findFirstField(data, ['status']);
  const message = findFirstField(data, ['statusmessage', 'statusMessage', 'message']);

  return { status, message };
}

function extractPostResultErrors(data) {
  const errors = [];

  function visit(node, depth = 0) {
    if (!node || depth > 8 || typeof node !== 'object') {
      return;
    }
    if (Array.isArray(node)) {
      for (const item of node) {
        visit(item, depth + 1);
      }
      return;
    }

    for (const [key, value] of Object.entries(node)) {
      if (key.toLowerCase() === 'errors' && Array.isArray(value)) {
        for (const error of value) {
          if (error && typeof error === 'object' && Object.keys(error).length > 0) {
            errors.push(error);
          }
        }
      }
      visit(value, depth + 1);
    }
  }

  visit(data);
  return errors;
}

function formatPostResultError(error) {
  const code = findFirstField(error, ['code']);
  const message = findFirstField(error, ['message']);
  const detail = findFirstField(error, ['detail']);
  return [
    code ? `code ${code}` : '',
    message,
    detail,
  ].filter(Boolean).join(': ');
}

function assertAroFloSuccess(data) {
  const { status, message } = extractStatus(data);
  if (status && String(status) !== '0') {
    throw new Error(`AroFlo API returned status ${status}${message ? `: ${message}` : ''}`);
  }

  const postResultErrors = extractPostResultErrors(data);
  if (postResultErrors.length > 0) {
    throw new Error(`AroFlo API returned postxml errors: ${postResultErrors.map(formatPostResultError).join('; ')}`);
  }
}

function extractRecords(data, preferredKeys = []) {
  const preferred = new Set(preferredKeys.map((key) => key.toLowerCase()));
  const records = [];
  const seen = new Set();

  function addRecord(record) {
    if (!record || typeof record !== 'object') {
      return;
    }
    const key = JSON.stringify(record);
    if (!seen.has(key)) {
      records.push(record);
      seen.add(key);
    }
  }

  function addValue(value) {
    if (Array.isArray(value)) {
      value.forEach(addRecord);
      return;
    }
    if (!value || typeof value !== 'object') {
      return;
    }

    const arrayValues = Object.values(value).filter(Array.isArray);
    if (arrayValues.length > 0) {
      arrayValues.forEach((arrayValue) => arrayValue.forEach(addRecord));
      return;
    }

    if (Object.keys(value).length > 1) {
      addRecord(value);
    }
  }

  function visit(node, depth = 0) {
    if (!node || depth > 6) {
      return;
    }
    if (Array.isArray(node)) {
      node.forEach(addRecord);
      return;
    }
    if (typeof node !== 'object') {
      return;
    }

    for (const [key, value] of Object.entries(node)) {
      if (preferred.has(key.toLowerCase())) {
        addValue(value);
      }
    }

    for (const value of Object.values(node)) {
      visit(value, depth + 1);
    }
  }

  visit(data);
  return records;
}

async function getZone(input, entries) {
  const credentials = requireCredentials(input);
  const varString = buildVarString(entries);
  const signed = buildSignedHeaders({
    credentials,
    method: 'GET',
    varString,
  });

  const response = await axios.get(`${normalizeBaseUrl(credentials.baseUrl)}?${varString}`, {
    headers: signed.headers,
    timeout: DEFAULT_TIMEOUT_MS,
  });

  assertAroFloSuccess(response.data);
  return response.data;
}

async function postXml(input, zone, postxml) {
  const credentials = requireCredentials(input);
  const varString = buildVarString([
    ['zone', zone],
    ['postxml', postxml],
  ]);
  const signed = buildSignedHeaders({
    credentials,
    method: 'POST',
    varString,
  });

  const response = await axios.post(normalizeBaseUrl(credentials.baseUrl), varString, {
    headers: {
      ...signed.headers,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    timeout: DEFAULT_TIMEOUT_MS,
  });

  assertAroFloSuccess(response.data);
  return response.data;
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function compactPhone(value) {
  return String(value || '').replace(/[^\d+]/g, '');
}

function phoneSearchValues(phoneNumber) {
  const compact = compactPhone(phoneNumber);
  return unique([
    String(phoneNumber || '').trim(),
    compact,
    compact.startsWith('+') ? compact.slice(1) : '',
  ]);
}

function contactPhoneSearchEntries(phoneNumber) {
  return [
    ['zone', 'contacts'],
    ['where', 'and|archived|=|false'],
    ['where', `and|(|phone|=|${phoneNumber}`],
    ['where', `or|mobile|=|${phoneNumber}|)`],
    ['page', '1'],
    ['pageSize', '20'],
  ];
}

function clientNameSearchEntries(clientName, { includeArchivedFilter = true }: any = {}) {
  const entries = [
    ['zone', 'clients'],
  ];

  if (includeArchivedFilter) {
    entries.push(['where', 'and|archived|=|false']);
  }

  entries.push(['where', `and|clientname|=|${clientName}`]);
  entries.push(['page', '1']);
  entries.push(['pageSize', '20']);
  return entries;
}

function clientListEntries(page = '1', pageSize = '100') {
  return [
    ['zone', 'clients'],
    ['page', page],
    ['pageSize', pageSize],
  ];
}

function normalComparablePhone(value) {
  return compactPhone(value).replace(/^\+/, '');
}

function phoneMatches(record, phoneNumber) {
  const target = normalComparablePhone(phoneNumber);
  if (!target) {
    return true;
  }

  const fields = ['phone', 'mobile', 'fax', 'workphone', 'businessphone', 'homephone'];
  return fields.some((field) => normalComparablePhone(findFirstField(record, [field])) === target);
}

function mapContact(record, fallbackPhone = '') {
  const org = record?.org || {};
  const contactId = firstValue(
    findFirstField(record, ['contactid', 'contactId', 'id']),
    findFirstField(record, ['userid', 'userId'])
  );
  const clientId = firstValue(
    findFirstField(record, ['clientid', 'clientId']),
    findFirstField(org, ['orgid', 'orgId']),
    findFirstField(record, ['orgid', 'orgId'])
  );
  const firstName = findFirstField(record, ['givennames', 'givenNames', 'firstname', 'firstName']);
  const surname = findFirstField(record, ['surname', 'lastname', 'lastName']);
  const fallbackName = findFirstField(record, ['contactname', 'contactName', 'fullname', 'fullName', 'name', 'clientname', 'clientName']);
  const name = firstValue([firstName, surname].filter(Boolean).join(' '), fallbackName, findFirstField(record, ['email']), fallbackPhone, contactId, clientId);
  const phone = firstValue(findFirstField(record, ['phone']), findFirstField(record, ['mobile']), fallbackPhone);
  const email = firstValue(findFirstField(record, ['email']), findFirstField(record, ['email2']));
  const clientName = firstValue(findFirstField(record, ['clientname', 'clientName']), findFirstField(org, ['orgname', 'orgName']));

  return {
    id: contactId || clientId || `${name}:${phone}`,
    contactId,
    clientId,
    name,
    type: 'Contact',
    phone,
    createdDate: findFirstField(record, ['datecreated', 'createdDate']),
    mostRecentActivityDate: findFirstField(record, ['lastupdateutc', 'updatedDate']),
    additionalInfo: {
      contactId,
      clientId,
      clientName,
      email,
      phone,
      mobile: findFirstField(record, ['mobile']),
    },
  };
}

function mapClient(record) {
  const clientId = findFirstField(record, ['clientid', 'clientId', 'id']);
  const name = firstValue(findFirstField(record, ['clientname', 'clientName', 'name']), clientId);
  return {
    id: clientId,
    clientId,
    name,
    phone: firstValue(findFirstField(record, ['phone']), findFirstField(record, ['mobile'])),
    email: findFirstField(record, ['email']),
    raw: record,
  };
}

function escapeXml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function cdata(value) {
  return `<![CDATA[${String(value || '').replace(/\]\]>/g, ']]]]><![CDATA[>')}]]>`;
}

function buildClientNoteXml({ clientId, content, filter, sticky, clientNoteId = '' }: any) {
  const idXml = clientNoteId ? `<noteid>${escapeXml(clientNoteId)}</noteid>` : '';
  return [
    '<clientnotes><clientnote>',
    idXml,
    `<clientid>${escapeXml(clientId)}</clientid>`,
    `<content>${cdata(content)}</content>`,
    `<filter>${cdata(filter || DEFAULT_NOTE_FILTER)}</filter>`,
    `<sticky>${sticky ? 'true' : 'false'}</sticky>`,
    '</clientnote></clientnotes>',
  ].join('');
}

async function createClientNote(input, { clientId, content, filter, sticky }) {
  const credentials = normalizeCredentials(input);
  const data = await postXml(input, 'ClientNotes', buildClientNoteXml({
    clientId,
    content,
    filter: filter || credentials.noteFilter,
    sticky: sticky ?? credentials.noteSticky,
  }));
  const noteRecord = extractRecords(data, ['clientnote', 'clientnotes', 'note', 'notes'])[0] || data;
  const noteId = findFirstField(noteRecord, ['clientnoteid', 'clientNoteId', 'noteid', 'id']);
  return { data, noteId };
}

async function updateClientNote(input, { clientId, clientNoteId, content, filter, sticky }) {
  const credentials = normalizeCredentials(input);
  const data = await postXml(input, 'ClientNotes', buildClientNoteXml({
    clientId,
    clientNoteId,
    content,
    filter: filter || credentials.noteFilter,
    sticky: sticky ?? credentials.noteSticky,
  }));
  return { data };
}

function buildClientXml({ name, phoneNumber = '', orgId = '' }: any) {
  const phone = phoneNumber || DEFAULT_PLACEHOLDER_CLIENT_PHONE;
  return [
    '<clients><client>',
    `<clientname>${cdata(name)}</clientname>`,
    `<firstname>${cdata(DEFAULT_PLACEHOLDER_CLIENT_FIRST_NAME)}</firstname>`,
    `<surname>${cdata(DEFAULT_PLACEHOLDER_CLIENT_SURNAME)}</surname>`,
    `<abn>${cdata(DEFAULT_PLACEHOLDER_CLIENT_ABN)}</abn>`,
    `<shortname>${cdata(DEFAULT_PLACEHOLDER_CLIENT_SHORT_NAME)}</shortname>`,
    `<phone>${cdata(phone)}</phone>`,
    `<mobile>${cdata(DEFAULT_PLACEHOLDER_CLIENT_MOBILE)}</mobile>`,
    `<fax>${cdata(DEFAULT_PLACEHOLDER_CLIENT_FAX)}</fax>`,
    `<email>${cdata(DEFAULT_PLACEHOLDER_CLIENT_EMAIL)}</email>`,
    `<website>${cdata(DEFAULT_PLACEHOLDER_CLIENT_WEBSITE)}</website>`,
    `<termsnote>${cdata(DEFAULT_PLACEHOLDER_CLIENT_TERMS_NOTE)}</termsnote>`,
    orgId ? `<orgs><org><orgid>${escapeXml(orgId)}</orgid></org></orgs>` : '',
    '<address>',
    `<addressline1>${cdata(DEFAULT_PLACEHOLDER_CLIENT_ADDRESS_LINE_1)}</addressline1>`,
    `<addressline2>${cdata(DEFAULT_PLACEHOLDER_CLIENT_ADDRESS_LINE_2)}</addressline2>`,
    `<suburb>${cdata(DEFAULT_PLACEHOLDER_CLIENT_SUBURB)}</suburb>`,
    `<state>${cdata(DEFAULT_PLACEHOLDER_CLIENT_STATE)}</state>`,
    `<postcode>${cdata(DEFAULT_PLACEHOLDER_CLIENT_POSTCODE)}</postcode>`,
    `<country>${cdata(DEFAULT_PLACEHOLDER_CLIENT_COUNTRY)}</country>`,
    '</address>',
    '<mailingaddress>',
    `<addressline1>${cdata(DEFAULT_PLACEHOLDER_CLIENT_ADDRESS_LINE_1)}</addressline1>`,
    `<addressline2>${cdata(DEFAULT_PLACEHOLDER_CLIENT_ADDRESS_LINE_2)}</addressline2>`,
    `<suburb>${cdata(DEFAULT_PLACEHOLDER_CLIENT_SUBURB)}</suburb>`,
    `<state>${cdata(DEFAULT_PLACEHOLDER_CLIENT_STATE)}</state>`,
    `<postcode>${cdata(DEFAULT_PLACEHOLDER_CLIENT_POSTCODE)}</postcode>`,
    `<country>${cdata(DEFAULT_PLACEHOLDER_CLIENT_COUNTRY)}</country>`,
    '</mailingaddress>',
    '</client></clients>',
  ].join('');
}

function isInvalidWhereClauseError(error) {
  return /Invalid WHERE Clause/i.test(`${error?.message || ''} ${JSON.stringify(error?.response?.data || {})}`);
}

async function findClientByName(input, { name }) {
  const expected = String(name || '').trim().toLowerCase();
  const queryAttempts = [
    clientNameSearchEntries(name),
    clientNameSearchEntries(name, { includeArchivedFilter: false }),
  ];
  let invalidWhereError = null;

  for (const entries of queryAttempts) {
    try {
      const data = await getZone(input, entries);
      const clients = extractRecords(data, ['client', 'clients']).map((record) => mapClient(record));
      return clients.find((client) => client.name.toLowerCase() === expected) || clients[0] || null;
    }
    catch (error) {
      if (!isInvalidWhereClauseError(error)) {
        throw error;
      }
      invalidWhereError = error;
    }
  }

  for (let page = 1; page <= 10; page += 1) {
    const data = await getZone(input, clientListEntries(String(page), '100'));
    const clients = extractRecords(data, ['client', 'clients']).map((record) => mapClient(record));
    const matchedClient = clients.find((client) => client.name.toLowerCase() === expected);
    if (matchedClient) {
      return matchedClient;
    }
    if (clients.length < 100) {
      return null;
    }
  }

  if (invalidWhereError) {
    return null;
  }
  return null;
}

async function createClient(input, { name, phoneNumber = '' }) {
  const { orgEncoded } = requireCredentials(input);
  const data = await postXml(input, 'clients', buildClientXml({ name, phoneNumber, orgId: orgEncoded }));
  const clientRecord = extractRecords(data, ['client', 'clients'])[0] || data;
  return {
    data,
    client: mapClient({
      ...clientRecord,
      clientname: name,
      phone: phoneNumber,
    }),
  };
}

async function getOrCreatePlaceholderClient(input) {
  const existingClient = await findClientByName(input, { name: DEFAULT_PLACEHOLDER_CLIENT_NAME });
  if (existingClient?.clientId) {
    return existingClient;
  }

  const { client } = await createClient(input, { name: DEFAULT_PLACEHOLDER_CLIENT_NAME });
  if (client?.clientId) {
    return client;
  }

  const createdClient = await findClientByName(input, { name: DEFAULT_PLACEHOLDER_CLIENT_NAME });
  if (createdClient?.clientId) {
    return createdClient;
  }

  throw new Error(`Could not determine AroFlo clientid for placeholder client "${DEFAULT_PLACEHOLDER_CLIENT_NAME}".`);
}

function buildClientContactXml({ clientId, name, phoneNumber, email }) {
  const nameParts = String(name || '').trim().split(/\s+/);
  const givenNames = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : name;
  const surname = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';

  return [
    '<clients><client>',
    `<clientid>${escapeXml(clientId)}</clientid>`,
    '<contacts><contact>',
    `<givennames>${cdata(givenNames)}</givennames>`,
    `<surname>${cdata(surname)}</surname>`,
    `<phone>${cdata(phoneNumber)}</phone>`,
    email ? `<email>${cdata(email)}</email>` : '',
    '</contact></contacts>',
    '</client></clients>',
  ].join('');
}

async function createClientContact(input, { clientId, name, phoneNumber, email }) {
  const data = await postXml(input, 'clients', buildClientContactXml({
    clientId,
    name,
    phoneNumber,
    email,
  }));
  const contactRecord = extractRecords(data, ['contact', 'contacts'])[0] || data;
  return {
    data,
    contact: mapContact({
      ...contactRecord,
      clientid: clientId,
      phone: phoneNumber,
      contactname: name,
    }, phoneNumber),
  };
}

function getContactClientId(contactInfo) {
  return firstValue(
    contactInfo?.additionalInfo?.clientId,
    contactInfo?.additionalInfo?.clientid,
    contactInfo?.clientId,
    contactInfo?.clientid
  );
}

function getContactId(contactInfo) {
  return firstValue(
    contactInfo?.additionalInfo?.contactId,
    contactInfo?.additionalInfo?.contactid,
    contactInfo?.contactId,
    contactInfo?.contactid,
    contactInfo?.id
  );
}

let accountDataModel = null;

async function findClientIdInAccountDataCache({ user, contactId }) {
  if (!user?.rcAccountId || !contactId) {
    return '';
  }

  try {
    if (!accountDataModel) {
      accountDataModel = require('@app-connect/core/models/accountDataModel').AccountDataModel;
    }

    const rows = await accountDataModel.findAll({
      where: {
        rcAccountId: user.rcAccountId,
        platformName: user.platform || 'AroFlo',
      },
    });

    for (const row of rows || []) {
      if (!String(row.dataKey || '').startsWith('contact-')) {
        continue;
      }
      const cachedContacts = Array.isArray(row.data) ? row.data : [row.data];
      const matched = cachedContacts.find((cachedContact) => getContactId(cachedContact) === contactId);
      const clientId = getContactClientId(matched);
      if (clientId) {
        return clientId;
      }
    }
  }
  catch (e) {
    return '';
  }

  return '';
}

async function getContactClientIdWithCache({ user, contactInfo }) {
  const directClientId = getContactClientId(contactInfo);
  if (directClientId) {
    return directClientId;
  }

  const contactId = getContactId(contactInfo);
  return findClientIdInAccountDataCache({ user, contactId });
}

function encodeLogId(payload) {
  return `aroflo:${Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')}`;
}

function decodeLogId(logId) {
  if (!logId || typeof logId !== 'string') {
    return null;
  }
  if (logId.startsWith('aroflo:')) {
    try {
      return JSON.parse(Buffer.from(logId.slice('aroflo:'.length), 'base64url').toString('utf8'));
    }
    catch (e) {
      return null;
    }
  }
  return null;
}

function connectorError(action, error) {
  const responseData = error?.response?.data;
  const responseDetails = responseData ? ` ${JSON.stringify(responseData)}` : '';
  return `${action} failed: ${error.message || String(error)}${responseDetails}`;
}

module.exports = {
  DEFAULT_PLACEHOLDER_CLIENT_NAME,
  assertAroFloSuccess,
  buildClientNoteXml,
  buildClientXml,
  buildSignedHeaders,
  buildVarString,
  compactPhone,
  connectorError,
  clientListEntries,
  clientNameSearchEntries,
  contactPhoneSearchEntries,
  createClient,
  createClientContact,
  createClientNote,
  decodeLogId,
  encodeLogId,
  extractRecords,
  findClientByName,
  findFirstField,
  getContactClientId,
  getContactClientIdWithCache,
  getOrCreatePlaceholderClient,
  getZone,
  mapClient,
  mapContact,
  normalizeCredentials,
  phoneMatches,
  phoneSearchValues,
  requireCredentials,
  updateClientNote,
};


