jest.mock('../src/connectors/arofloClient', () => ({
  connectorError: jest.fn((action, error) => `${action} failed: ${error.message}`),
  decodeLogId: jest.fn(),
  extractRecords: jest.fn(),
  findFirstField: jest.fn((record, names) => {
    if (!record) return '';
    const entries = Object.entries(record);
    for (const name of names) {
      const found = entries.find(([key, value]) => key.toLowerCase() === name.toLowerCase() && value !== undefined && value !== null && String(value).trim() !== '');
      if (found) return String(found[1]).trim();
    }
    return '';
  }),
  getZone: jest.fn(),
}));

const {
  decodeLogId,
  extractRecords,
  getZone,
} = require('../src/connectors/arofloClient');
const getCallLog = require('../src/connectors/interfaces/getCallLog');

describe('AroFlo getCallLog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    decodeLogId.mockReturnValue({ type: 'clientnote', clientId: 'client-1', noteId: 'note-1' });
    getZone.mockResolvedValue({});
    extractRecords.mockReturnValue([]);
  });

  it('fetches ClientNotes by noteid and returns the matching call log body', async () => {
    extractRecords.mockReturnValue([
      {
        noteid: 'wrong-note',
        clientid: 'client-1',
        content: 'Wrong subject\n\nWrong note',
      },
      {
        noteid: 'note-1',
        clientid: 'client-1',
        content: '[Call] Inbound call with Test RCLabs\n\n- Note: Correct call note\n- Summary: [Call] Inbound call with Test RCLabs\n- Duration: 10 seconds',
      },
    ]);

    const result = await getCallLog({
      user: {},
      callLogId: 'encoded-log-id',
      authHeader: 'Basic token',
    });

    expect(getZone).toHaveBeenCalledWith({ user: {}, authHeader: 'Basic token' }, [
      ['zone', 'ClientNotes'],
      ['where', 'and|noteid|=|note-1'],
      ['where', 'and|clientid|=|client-1'],
      ['page', '1'],
      ['pageSize', '20'],
    ]);
    expect(result.callLogInfo).toEqual({
      subject: '[Call] Inbound call with Test RCLabs',
      note: 'Correct call note',
      fullBody: '[Call] Inbound call with Test RCLabs\n\n- Note: Correct call note\n- Summary: [Call] Inbound call with Test RCLabs\n- Duration: 10 seconds',
    });
    expect(result.returnMessage.messageType).toBe('success');
  });

  it('prefers updated Summary field over stale first-line subject', async () => {
    extractRecords.mockReturnValue([
      {
        noteid: 'note-1',
        clientid: 'client-1',
        content: 'Old subject\n\n- Note: Updated note\n- Summary: New subject\n- Duration: 10 seconds',
      },
    ]);

    const result = await getCallLog({
      user: {},
      callLogId: 'encoded-log-id',
      authHeader: 'Basic token',
    });

    expect(result.callLogInfo).toMatchObject({
      subject: 'New subject',
      note: 'Updated note',
    });
  });
  it('does not return the first ClientNote when the requested note id is absent', async () => {
    extractRecords.mockReturnValue([
      {
        noteid: 'wrong-note',
        clientid: 'client-1',
        content: 'Wrong body',
      },
    ]);

    const result = await getCallLog({
      user: {},
      callLogId: 'encoded-log-id',
      authHeader: 'Basic token',
    });

    expect(result.callLogInfo).toEqual({ subject: '', note: '', fullBody: '' });
    expect(result.returnMessage).toMatchObject({
      message: 'AroFlo call log could not be matched.',
      messageType: 'warning',
    });
  });
});