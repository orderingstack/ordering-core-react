import React from 'react';

export default React.createContext<IConfig | null>(null);

export interface IConfig {
  tenant: string;
  baseUrl: string;
  tenantAuthConfig: string;
  basicAuth: string;
  enableKDS: boolean;
  venue: string;
  anonymousOnInit: boolean;
  moduleId?: string;
  refreshToken?: string;
}
