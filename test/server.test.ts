const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.test') });
const request = require('supertest');
const { app } = require('../src/app');

describe('Server', () => {
    describe('GET /is-alive', () => {
        it('should return health status', async () => {
            const response = await request(app)
                .get('/is-alive')
                .expect(200);
            expect(response.text).toBe('OK');
        });
    });

    describe('GET /crmManifest', () => {
        it('should expose the AroFlo API-key auth field', async () => {
            const response = await request(app)
                .get('/crmManifest?platformName=AroFlo')
                .expect(200);
            const platform = Array.isArray(response.body.platforms)
                ? response.body.platforms.find((item) => item.name === 'AroFlo')
                : response.body.platforms.AroFlo;
            const fields = platform.auth.apiKey.page.content.map((field) => field.const);
            expect(fields).toEqual(expect.arrayContaining(['apiKey']));
        });
    });
});