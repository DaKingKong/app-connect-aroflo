/*
 * Standalone AroFlo clients lookup script.
 *
 * Usage:
 *   1. Fill API_KEY below, or set AROFLO_API_KEY for this terminal session.
 *   2. Make sure .env has AROFLO_U_ENCODED, AROFLO_P_ENCODED, AROFLO_ORG_ENCODED.
 *   3. Run:
 *        node test-aroflo-clients.js
 *      Optional client-name filter:
 *        node test-aroflo-clients.js "ABC Electrical"
 */

require('dotenv').config();

const axios = require('axios');
const crypto = require('crypto');

// Paste the AroFlo API Secret Key here for a quick local test.
// Prefer AROFLO_API_KEY in your shell if you do not want to edit this file.
const API_KEY = 'VlJ2UnVUczZ2TldYV291KytubVhTelBJMW93VlNaZ2hhMHdRNFdwN1NTT2oxeVlSY2tKSW5PeVJYcW02ek9OMzVYVEZFbkorTU5HdWp3RlBzTWZDWFE9PQ==';

const BASE_URL = process.env.AROFLO_BASE_URL || 'https://api.aroflo.com/';
const ACCEPT = process.env.AROFLO_ACCEPT || 'text/json';
const U_ENCODED = process.env.AROFLO_U_ENCODED || '';
const P_ENCODED = process.env.AROFLO_P_ENCODED || '';
const ORG_ENCODED = process.env.AROFLO_ORG_ENCODED || '';
const HOST_IP = process.env.AROFLO_HOST_IP || '';
const PAGE = process.env.AROFLO_CLIENT_PAGE || '1';
const PAGE_SIZE = process.env.AROFLO_CLIENT_PAGE_SIZE || '10';
const CLIENT_NAME_FILTER = process.argv.slice(2).join(' ').trim();

function required(name, value) {
  if (!value) {
    throw new Error(`Missing ${name}. Fill it in this script or .env before running.`);
  }
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

function buildAuthorization() {
  return [
    `uencoded=${encodeURIComponent(U_ENCODED)}`,
    `pencoded=${encodeURIComponent(P_ENCODED)}`,
    `orgEncoded=${encodeURIComponent(ORG_ENCODED)}`,
  ].join('&');
}

function buildSignedHeaders(method, varString) {
  const timestamp = new Date().toISOString();
  const authorization = buildAuthorization();
  const payload = [method.toUpperCase()];

  if (HOST_IP) {
    payload.push(HOST_IP);
  }

  payload.push('');
  payload.push(ACCEPT);
  payload.push(authorization);
  payload.push(timestamp);
  payload.push(varString);

  const signature = crypto
    .createHmac('sha512', API_KEY)
    .update(payload.join('+'))
    .digest('hex');

  const headers = {
    Authentication: `HMAC ${signature}`,
    Authorization: authorization,
    Accept: ACCEPT,
    afdatetimeutc: timestamp,
  };

  if (HOST_IP) {
    headers.HostIP = HOST_IP;
  }

  return headers;
}

function findFirstField(record, names) {
  if (!record || typeof record !== 'object') {
    return '';
  }
  const normalized = names.map((name) => name.toLowerCase());
  for (const [key, value] of Object.entries(record)) {
    if (normalized.includes(key.toLowerCase()) && value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }
  return '';
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

  function visit(node, depth = 0) {
    if (!node || depth > 8) {
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
        if (Array.isArray(value)) {
          value.forEach(addRecord);
        } else if (value && typeof value === 'object') {
          addRecord(value);
        }
      }
    }

    for (const value of Object.values(node)) {
      visit(value, depth + 1);
    }
  }

  visit(data);
  return records;
}

function buildClientEntries({ includeArchivedFilter = true, includeNameFilter = true } = {}) {
  const entries = [
    ['zone', 'clients'],
  ];

  if (includeArchivedFilter) {
    entries.push(['where', 'and|archived|=|false']);
  }

  if (includeNameFilter && CLIENT_NAME_FILTER) {
    entries.push(['where', `and|clientname|=|${CLIENT_NAME_FILTER}`]);
  }

  entries.push(['page', PAGE]);
  entries.push(['pageSize', PAGE_SIZE]);
  return entries;
}

function isInvalidWhereClauseError(error) {
  return /Invalid WHERE Clause/i.test(`${error?.message || ''} ${JSON.stringify(error?.response?.data || {})}`);
}

async function requestClients(entries) {
  const varString = buildVarString(entries);
  const url = `${normalizeBaseUrl(BASE_URL)}?${varString}`;
  const headers = buildSignedHeaders('GET', varString);

  console.log(`Requesting AroFlo clients: ${url}`);
  return axios.get(url, { headers, timeout: 30000 });
}

async function main() {
  required('API_KEY / AROFLO_API_KEY', API_KEY);
  required('AROFLO_U_ENCODED', U_ENCODED);
  required('AROFLO_P_ENCODED', P_ENCODED);
  required('AROFLO_ORG_ENCODED', ORG_ENCODED);

  let response;
  let filterLocallyByName = false;
  try {
    response = await requestClients(buildClientEntries());
  }
  catch (error) {
    if (!isInvalidWhereClauseError(error)) {
      throw error;
    }
    console.warn('AroFlo rejected the first Client WHERE clause. Retrying without archived=false.');
    try {
      response = await requestClients(buildClientEntries({ includeArchivedFilter: false }));
    }
    catch (secondError) {
      if (!isInvalidWhereClauseError(secondError)) {
        throw secondError;
      }
      console.warn('AroFlo rejected Client name WHERE filtering. Retrying without WHERE filters and filtering locally.');
      filterLocallyByName = !!CLIENT_NAME_FILTER;
      response = await requestClients(buildClientEntries({ includeArchivedFilter: false, includeNameFilter: false }));
    }
  }

  let clients = extractRecords(response.data, ['client', 'clients']).map((client) => ({
    clientid: findFirstField(client, ['clientid', 'clientId', 'id']),
    clientname: findFirstField(client, ['clientname', 'clientName', 'name']),
    phone: findFirstField(client, ['phone', 'mobile']),
    email: findFirstField(client, ['email']),
    raw: client,
  }));

  if (filterLocallyByName) {
    const expected = CLIENT_NAME_FILTER.toLowerCase();
    clients = clients.filter((client) => client.clientname.toLowerCase() === expected);
  }

  console.log(`Found ${clients.length} client record(s).`);
  console.log(JSON.stringify(clients, null, 2));

  if (clients.length === 0) {
    console.log('Raw response:');
    console.log(JSON.stringify(response.data, null, 2));
  }
}
main().catch((error) => {
  const responseData = error.response?.data;
  console.error('AroFlo clients lookup failed.');
  console.error(error.message);
  if (responseData) {
    console.error(JSON.stringify(responseData, null, 2));
  }
  process.exit(1);
});