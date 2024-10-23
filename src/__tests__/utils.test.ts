import axios from 'axios';
import { getErrorMessage } from '../utils';
const tenant = '8724ef16-20c8-4008-b183-3504cedc38af';
const api = axios.create({
  baseURL: 'https://ordering.3e.pl',
  headers: {
    Authorization: 'Basic b3JkZXJpbmdrZHNzaG9ydDpjTDlCZ21zcmZXM3VKSGQ1MEk=',
    'X-Tenant': tenant,
    'Content-Type': 'application/x-www-form-urlencoded',
  },
});
const VALID_MODULE = 'kds-test'; // module with user

describe('Device Code Error Handler', () => {
  it('should return error kind "INVALID_MODULE" if invalid module id was provided', async () => {
    try {
      await api.post('/auth-oauth2/oauth/device', {
        module: 'invalid-module',
      });
    } catch (e: any) {
      const err = getErrorMessage(e);
      console.log(err);
      expect(err.message).not.toBe(undefined);
      expect(err.kind).toBe('INVALID_MODULE');
    }
  });
});
