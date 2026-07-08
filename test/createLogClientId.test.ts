jest.mock('../src/connectors/arofloClient', () => ({
  connectorError: jest.fn((action, error) => `${action} failed: ${error.message}`),
  createClientNote: jest.fn(),
  encodeLogId: jest.fn(({ clientId, noteId }) => `encoded:${clientId}:${noteId}`),
  getContactClientIdWithCache: jest.fn(),
  normalizeCredentials: jest.fn(() => ({ noteFilter: 'Internal Only', noteSticky: false })),
}));

const {
  createClientNote,
  getContactClientIdWithCache,
} = require('../src/connectors/arofloClient');
const createCallLog = require('../src/connectors/interfaces/createCallLog');
const createMessageLog = require('../src/connectors/interfaces/createMessageLog');

describe('AroFlo log client id resolution', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getContactClientIdWithCache.mockResolvedValue('cached-client-1');
    createClientNote.mockResolvedValue({ noteId: 'note-1' });
  });

  it('uses cache-aware clientId resolution for call logs', async () => {
    const user = { rcAccountId: 'rc-account-1', platform: 'AroFlo' };
    const contactInfo = { contactId: 'contact-1', additionalInfo: { contactId: 'contact-1' } };

    const result = await createCallLog({
      user,
      contactInfo,
      authHeader: 'Basic token',
      callLog: { direction: 'Inbound' },
      note: 'Call note',
    });

    expect(getContactClientIdWithCache).toHaveBeenCalledWith({ user, contactInfo });
    expect(createClientNote).toHaveBeenCalledWith({ user, authHeader: 'Basic token' }, expect.objectContaining({
      clientId: 'cached-client-1',
      content: expect.stringContaining('Call note'),
    }));
    expect(result.logId).toBe('encoded:cached-client-1:note-1');
  });

  it('uses cache-aware clientId resolution for message logs', async () => {
    const user = { rcAccountId: 'rc-account-1', platform: 'AroFlo' };
    const contactInfo = { contactId: 'contact-1', additionalInfo: { contactId: 'contact-1' } };

    const result = await createMessageLog({
      user,
      contactInfo,
      authHeader: 'Basic token',
      message: {
        direction: 'Inbound',
        from: { phoneNumber: '+14045550100' },
        to: [{ phoneNumber: '+14045550101' }],
      },
    });

    expect(getContactClientIdWithCache).toHaveBeenCalledWith({ user, contactInfo });
    expect(createClientNote).toHaveBeenCalledWith({ user, authHeader: 'Basic token' }, expect.objectContaining({
      clientId: 'cached-client-1',
      content: expect.stringContaining('From: +14045550100'),
    }));
    expect(result.logId).toBe('encoded:cached-client-1:note-1');
  });
});