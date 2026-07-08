jest.mock('../src/connectors/arofloClient', () => ({
  connectorError: jest.fn((action, error) => `${action} failed: ${error.message}`),
  getZone: jest.fn(),
}));

const { getZone } = require('../src/connectors/arofloClient');
const refreshUserInfo = require('../src/connectors/interfaces/refreshUserInfo');
const aroflo = require('../src/connectors/aroflo');

describe('AroFlo refreshUserInfo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('is exported by the connector module', () => {
    expect(typeof aroflo.refreshUserInfo).toBe('function');
  });

  it('validates the stored AroFlo credentials with a lightweight user lookup', async () => {
    getZone.mockResolvedValueOnce({ users: [] });

    const result = await refreshUserInfo({
      user: { accessToken: 'secret-key', platformAdditionalInfo: { uEncoded: 'u', pEncoded: 'p', orgEncoded: 'o' } },
      authHeader: 'Basic c2VjcmV0LWtleTo=',
    });

    expect(getZone).toHaveBeenCalledWith(
      expect.objectContaining({
        user: expect.any(Object),
        authHeader: 'Basic c2VjcmV0LWtleTo=',
      }),
      [
        ['zone', 'users'],
        ['page', '1'],
        ['pageSize', '1'],
      ]
    );
    expect(result).toMatchObject({
      successful: true,
      returnMessage: {
        messageType: 'success',
        message: 'User info refreshed',
      },
    });
  });

  it('returns a warning when AroFlo credential validation fails', async () => {
    getZone.mockRejectedValueOnce(new Error('401 Unauthorized'));

    const result = await refreshUserInfo({ user: {}, authHeader: '' });

    expect(result).toMatchObject({
      successful: false,
      returnMessage: {
        messageType: 'warning',
        message: 'Could not refresh AroFlo session. Please reconnect.',
      },
    });
  });
});