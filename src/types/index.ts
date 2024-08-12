import * as orderingCore from '@orderingstack/ordering-core';

export interface IDeviceCodeResponse {
  user_code: string;
  device_code: string;
  interval: number;
  verification_uri_complete: string;
  verification_uri: string;
  expires_in: number;
}

export interface ISuccessData {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}
export interface IAuthPending {
  error: 'authorization_pending';
  error_uri: string;
}
export interface ISlowDown {
  error: 'slow_down';
}

export interface AuthWrapperStateStruct {
  loggedIn: boolean;
  UUID: string;
  email?: string;
  authProvider: orderingCore.IConfiguredAuthDataProvider;
  signOut: Function;
  moduleConfig?: any;
  resolved?: boolean;
}
