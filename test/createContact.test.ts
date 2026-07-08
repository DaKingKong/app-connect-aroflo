jest.mock('../src/connectors/arofloClient', () => ({
  connectorError: jest.fn((action, error) => `${action} failed: ${error.message}`),
  createClientContact: jest.fn(),
  getOrCreatePlaceholderClient: jest.fn(),
}));

const {
  createClientContact,
  getOrCreatePlaceholderClient,
} = require('../src/connectors/arofloClient');
const createContact = require('../src/connectors/interfaces/createContact');

describe('AroFlo createContact', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getOrCreatePlaceholderClient.mockResolvedValue({
      clientId: 'client-placeholder',
      name: 'RingCentral App Connect Placeholder Client',
    });
    createClientContact.mockResolvedValue({
      contact: {
        id: 'contact-1',
        name: 'Ava Flo',
        type: 'Contact',
      },
    });
  });

  it('creates contacts under the placeholder client', async () => {
    const result = await createContact({
      user: {},
      authHeader: '',
      phoneNumber: '+14045550100',
      newContactName: 'Ava Flo',
      newContactType: undefined,
    });

    expect(getOrCreatePlaceholderClient).toHaveBeenCalledWith(expect.any(Object));
    expect(createClientContact).toHaveBeenCalledWith(expect.any(Object), {
      clientId: 'client-placeholder',
      name: 'Ava Flo',
      phoneNumber: '+14045550100',
    });
    expect(result.contactInfo).toMatchObject({
      id: 'contact-1',
      type: 'Contact',
    });
  });
});