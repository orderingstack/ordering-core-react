import { IRefreshTokenStorageHandler } from '@orderingstack/ordering-core';
import axios from 'axios';

const ax = axios.create({
  baseURL: 'http://localhost:8080',
  timeout: 20000,
});

/**
 * Network refresh token storage handler.
 * Compliant with <strong><em>/api/setdata</em></strong> and <strong><em>/api/getdata</em></strong> endpoints of Kiosk Local Service.
 */
export const networkRefreshTokenHandler: IRefreshTokenStorageHandler = {
  setRefreshToken(tenant: string, refreshToken: string): Promise<void> | void {
    return ax
      .post('/api/setdata', {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        name: `${tenant}_refresh_token`,
        value: refreshToken,
      })
      .then(() => {
        return;
      })
      .catch((err) => {
        console.error('error saving refresh token', err);
        return;
      });
  },
  getRefreshToken(tenant: string): Promise<string> | string {
    return ax
      .post<{
        createdAt: number;
        updatedAt: number;
        name: string;
        value: string;
      }>('/api/getdata', { name: `${tenant}_refresh_token` })
      .then(({ data }) => data.value)
      .catch((err) => {
        console.error('error getting refresh token', err);
        return '';
      });
  },
  clearRefreshToken(tenant: string): Promise<void> | void {
    return ax
      .post('/api/setdata', {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        name: `${tenant}_refresh_token`,
        value: '',
      })
      .then(() => {
        return;
      })
      .catch((err) => {
        console.error('error removing refresh token', err.message, err);
        return;
      });
  },
};
