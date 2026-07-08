jest.mock('../src/connectors/arofloClient', () => ({
  connectorError: jest.fn((action, error) => `${action} failed: ${error.message}`),
  contactPhoneSearchEntries: jest.fn((phone) => [['phone', phone]]),
  extractRecords: jest.fn(),
  getContactClientId: jest.fn(),
  getZone: jest.fn(),
  mapContact: jest.fn(),
  phoneMatches: jest.fn(),
  phoneSearchValues: jest.fn(),
}));

const {
  contactPhoneSearchEntries,
  extractRecords,
  getContactClientId,
  getZone,
  mapContact,
  phoneMatches,
  phoneSearchValues,
} = require('../src/connectors/arofloClient');
const findContact = require('../src/connectors/interfaces/findContact');

describe('AroFlo findContact', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    contactPhoneSearchEntries.mockImplementation((phone) => [['phone', phone]]);
    extractRecords.mockReturnValue([]);
    getContactClientId.mockImplementation((contact) => contact?.additionalInfo?.clientId || contact?.clientId || '');
    getZone.mockResolvedValue({});
    mapContact.mockImplementation((record) => record);
    phoneMatches.mockReturnValue(true);
    phoneSearchValues.mockImplementation((phone) => [phone]);
  });

  it('shows the create-contact placeholder even when no contact matches', async () => {
    const result = await findContact({
      user: {},
      authHeader: '',
      phoneNumber: '+14045550100',
    });

    expect(result.matchedContactInfo).toEqual([
      expect.objectContaining({
        id: 'createNewContact',
        type: 'Contact',
        isNewContact: true,
      }),
    ]);
    expect(result.returnMessage.message).toBe('Found 0 AroFlo contact(s).');
  });

  it('copies known clientId into additionalInfo for matched contacts', async () => {
    extractRecords.mockReturnValue([{ phone: '+14045550100' }]);
    mapContact.mockReturnValue({
      id: 'contact-1',
      name: 'Test Contact',
      type: 'Contact',
      phone: '+14045550100',
      clientId: 'client-1',
      additionalInfo: {},
    });

    const result = await findContact({
      user: {},
      authHeader: '',
      phoneNumber: '+14045550100',
    });

    expect(result.matchedContactInfo[0].additionalInfo.clientId).toBe('client-1');
  });
});