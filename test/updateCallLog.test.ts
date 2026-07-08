jest.mock('../src/connectors/arofloClient', () => ({
  connectorError: jest.fn((action, error) => `${action} failed: ${error.message}`),
  decodeLogId: jest.fn(),
  normalizeCredentials: jest.fn(() => ({ noteFilter: 'Internal Only', noteSticky: false })),
  updateClientNote: jest.fn(),
}));

const {
  decodeLogId,
  updateClientNote,
} = require('../src/connectors/arofloClient');
const updateCallLog = require('../src/connectors/interfaces/updateCallLog');

describe('AroFlo updateCallLog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    decodeLogId.mockReturnValue({ type: 'clientnote', clientId: 'client-1', noteId: 'note-1' });
    updateClientNote.mockResolvedValue({ data: {} });
  });

  it('syncs the first-line subject wrapper before updating ClientNote content', async () => {
    const result = await updateCallLog({
      user: {},
      existingCallLog: { thirdPartyLogId: 'encoded-log-id' },
      authHeader: 'Basic token',
      subject: 'New subject',
      note: 'Updated note',
      composedLogDetails: 'Old subject\n\n- Note: Updated note\n- Summary: New subject\n- Duration: 10 seconds',
    });

    expect(updateClientNote).toHaveBeenCalledWith({ user: {}, authHeader: 'Basic token' }, {
      clientId: 'client-1',
      clientNoteId: 'note-1',
      content: 'New subject\n\n- Note: Updated note\n- Summary: New subject\n- Duration: 10 seconds',
      filter: 'Internal Only',
      sticky: false,
    });
    expect(result.returnMessage.messageType).toBe('success');
  });
});