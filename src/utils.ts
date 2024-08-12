import { isAxiosError } from 'axios';

export function getErrorMessage(e: any): string | undefined {
  if (isAxiosError(e)) {
    console.warn(e);
    // this is a timeout error POST /code, don't show as error, GET new code
    if (e.config?.method === 'post' && e.response?.status === 408) {
      return undefined;
    }
    if (e.config?.method === 'get' && e.response?.status === 404) {
      return 'Module not found';
    }
    if (e.response?.data.message) {
      return `${e.response.data.message}`;
    }
    if (e.response?.data.error) {
      return e.response.data.error;
    }
    if (e.response?.data.description) {
      return e.response.data.description;
    }
  }
  return e.toString();
}
