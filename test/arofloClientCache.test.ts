jest.mock('@app-connect/core/models/accountDataModel', () => ({
  AccountDataModel: {
    findAll: jest.fn(),
  },
}));

const { AccountDataModel } = require('@app-connect/core/models/accountDataModel');
const { getContactClientIdWithCache } = require('../src/connectors/arofloClient');

describe('AroFlo contact client id cache helper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AccountDataModel.findAll.mockResolvedValue([]);
  });

  it('returns direct contact clientId without scanning accountData', async () => {
    await expect(getContactClientIdWithCache({
      user: { rcAccountId: 'rc-account-1', platform: 'AroFlo' },
      contactInfo: { additionalInfo: { clientId: 'direct-client-1' } },
    })).resolves.toBe('direct-client-1');

    expect(AccountDataModel.findAll).not.toHaveBeenCalled();
  });

  it('finds clientId from accountData cache when contactId is known', async () => {
    AccountDataModel.findAll.mockResolvedValue([
      {
        dataKey: 'contact-+14045550100',
        data: [
          {
            contactId: 'contact-1',
            additionalInfo: {
              contactId: 'contact-1',
              clientId: 'cached-client-1',
            },
          },
        ],
      },
    ]);

    await expect(getContactClientIdWithCache({
      user: { rcAccountId: 'rc-account-1', platform: 'AroFlo' },
      contactInfo: { contactId: 'contact-1', additionalInfo: { contactId: 'contact-1' } },
    })).resolves.toBe('cached-client-1');

    expect(AccountDataModel.findAll).toHaveBeenCalledWith({
      where: {
        rcAccountId: 'rc-account-1',
        platformName: 'AroFlo',
      },
    });
  });
});