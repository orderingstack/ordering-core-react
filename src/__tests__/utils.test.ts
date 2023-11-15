import axios from 'axios';
import { getErrorMessage } from '../utils';
const tenant = '8724ef16-20c8-4008-b183-3504cedc38af';
const api = axios.create({ baseURL: 'https://ordering.3e.pl' });
const VALID_MODULE = 'kds-test'; // module with user

describe('Code Error Handler', () => {
  it('should return error if POST /code returns error in data', async () => {
    try {
      await api.post('https://ordering.3e.pl/auth-oauth2/device/code', {
        code: 'ifXYPOxNRV',
        secret: '1N2Jyezg7uiky1SrksvISsYO',
        tenant,
      });
    } catch (e) {
      const message = getErrorMessage(e);
      expect(typeof message).toBe('string');
      expect(message).toBe('invalid_code');
    }
  });

  it('should return message if POST /code returns message in data', async () => {
    try {
      await api.post('https://ordering.3e.pl/auth-oauth2/device/code', {
        code: 'invalid-code',
        secret: 'secret',
        tenant,
      });
    } catch (e: any) {
      const message = getErrorMessage(e);
      expect(typeof message).toBe('string');
      expect(message).toBe(e.response?.data?.message);
    }
  });

  it('should return undefined upon 408 (timeout) from POST /code', async () => {
    try {
      const {
        data: { code, secret },
      } = await api.get('/auth-oauth2/device/code', {
        params: {
          tenant,
          module: VALID_MODULE,
        },
      });
      await api.post('/auth-oauth2/device/code', {
        code: code,
        secret: secret,
        tenant,
      });
    } catch (e: any) {
      const message = getErrorMessage(e);
      expect(message).toBe(undefined);
    }
  }, 120000);

  it('should return message if GET /code returns error in data', async () => {
    try {
      await api.get('/auth-oauth2/device/code', {
        params: {
          tenant: 'invalid-tenant',
          module: 'invalid-module',
        },
      });
    } catch (e: any) {
      const message = getErrorMessage(e);
      expect(message).not.toBe(undefined);
    }
  });
});
