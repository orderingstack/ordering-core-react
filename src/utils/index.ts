import { isAxiosError } from 'axios';

export type DeviceCodeError = 'TIMEOUT' | 'INVALID_MODULE' | 'UNKNOWN';

export function getErrorMessage(e: any): {
  message: string | undefined;
  kind: DeviceCodeError;
} {
  if (isAxiosError(e)) {
    // this is a timeout error POST /code, don't show as error, GET new code
    if (e.config?.method === 'post' && e.response?.status === 408) {
      return { message: undefined, kind: 'TIMEOUT' };
    }
    if (
      e.response?.status === 404 ||
      e.response?.data?.description?.includes('Cannot determine module')
    ) {
      return { message: 'Module not found', kind: 'INVALID_MODULE' };
    }
    console.warn(e);
    return {
      message:
        e.response?.data.message ||
        e.response?.data.error ||
        e.response?.data.description,
      kind: 'UNKNOWN',
    };
  }
  return { message: e.toString(), kind: 'UNKNOWN' };
}
