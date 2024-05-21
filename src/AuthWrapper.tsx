import React, {
  Fragment,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from 'react';
import AuthContext from './AuthContext';
import ConfigContext, { IConfig } from './ConfigContext';
import * as orderingCore from '@orderingstack/ordering-core';
import axios from 'axios';
import { getErrorMessage } from './utils';
import { QRCodeSVG } from 'qrcode.react';
import { FadeLoader } from 'react-spinners';
const COUNTDOWN = 10;
import { ApplicationInsights } from '@microsoft/applicationinsights-web';

function Loader() {
  return <FadeLoader />;
}

function QRLoader({ size }: { size: number }) {
  const height = Math.min(size / 10, 25);
  const width = Math.min(size / 30, 5);
  const radius = Math.min(height, width) / 2;
  return (
    <div
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <FadeLoader height={height} width={width} radius={radius} />
    </div>
  );
}

const _refreshStorageHandler: orderingCore.IRefreshTokenStorageHandler = {
  getRefreshToken: (tenant: string) => {
    return (
      window.localStorage.getItem(`orderingstack_${tenant}_refreshToken`) || ''
    );
  },
  setRefreshToken: (tenant: string, token: string) => {
    window.localStorage.setItem(`orderingstack_${tenant}_refreshToken`, token);
  },
  clearRefreshToken: (tenant: string) => {
    window.localStorage.removeItem(`orderingstack_${tenant}_refreshToken`);
  },
};

function DefaultDeviceCodeComp(props: IDeviceLoginState) {
  const {
    code,
    error,
    countDown,
    tenant,
    baseUrl,
    user,
    loading,
    codeTimestamp,
  } = props;
  const qrCode = useMemo(() => {
    let qrCode = code
      ? `${baseUrl}/user-service/device-code/${tenant}?code=${code}`
      : undefined;
    if (user && qrCode) {
      qrCode = qrCode + `&deviceUser=${user}`;
    }
    return qrCode;
  }, [code, baseUrl, user]);

  const size = Math.round(Math.min(window.innerHeight, window.innerWidth) / 3);
  const [seconds, setSeconds] = useState<number>(0);

  useEffect(() => {
    if (code && codeTimestamp) {
      const timer = setInterval(
        () => setSeconds(Math.round((Date.now() - codeTimestamp) / 1000)),
        1000,
      );
      return () => clearInterval(timer);
    } else {
      setSeconds(0);
    }
  }, [code, codeTimestamp]);

  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '2vw',
        backgroundColor: 'white',
      }}
    >
      <div
        style={{
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <h1>Please authorize this device</h1>
        {code && (
          <h1 style={{ display: 'flex', flexDirection: 'row' }}>
            Device code: {!loading ? code : ''}
            {loading && (
              <div style={{ display: 'flex', flexDirection: 'row' }}>
                &nbsp;&nbsp;&nbsp;&nbsp;
                <Loader />
                &nbsp;&nbsp;&nbsp;&nbsp;
              </div>
            )}
          </h1>
        )}
        {code && <h4>Refreshed: {seconds}s ago</h4>}
        {qrCode && !loading && (
          <QRCodeSVG value={qrCode} size={size} level="H" />
        )}
        {loading && <QRLoader size={size} />}
        {error && <h1 style={{ color: 'red' }}>Error: {error}</h1>}
        {countDown && <h1>Automatically restarting in {countDown} seconds</h1>}
      </div>
    </div>
  );
}

interface AuthWrapperStateStruct {
  loggedIn: boolean;
  UUID: string;
  email?: string;
  authProvider?: orderingCore.IConfiguredAuthDataProvider;
  signOut?: Function;
}

export interface IAuthProps {
  roles?: string[];
  disallowedRoles?: RegExp[];
  logoutOnDisallowedRoles?: boolean;
  appInsights?: ApplicationInsights;
  children: React.ReactNode;
  refreshStorageHandler?: orderingCore.IRefreshTokenStorageHandler;
  DeviceCodeComp?: React.FC<IDeviceLoginState>;
  DisallowedRolesComp?: React.FC<any>;
}

export interface IDeviceLoginState {
  isDeviceCode: boolean;
  code?: string;
  secret?: string;
  error?: string;
  countDown?: number;
  tenant: string;
  baseUrl: string;
  user?: string | null;
  codeTimestamp?: number;
  loading?: boolean;
}
type Action =
  | { type: 'enable'; payload?: undefined }
  | { type: 'loading'; payload?: undefined }
  | { type: 'disable'; payload?: undefined }
  | {
      type: 'setValues';
      payload: { code: string; secret: string; user?: string | null };
    }
  | { type: 'error'; payload: string }
  | { type: 'decrementCountDown'; payload?: undefined };

function isSuccess(data: any): data is SuccessData {
  return !data.error;
}

interface SuccessData {
  token_type: string;
  expires_in: number;
  access_token: string;
  refresh_token: string;
  TENANT: string;
  UUID: string;
}
interface ErrorData {
  error: string;
}

function deviceLoginReducer(
  state: IDeviceLoginState,
  action: Action,
): IDeviceLoginState {
  const { type, payload } = action;
  switch (type) {
    case 'enable':
      return {
        ...state,
        isDeviceCode: true,
      };
    case 'loading':
      return {
        ...state,
        isDeviceCode: true,
        loading: true,
      };
    case 'setValues':
      return {
        ...state,
        code: payload.code,
        secret: payload.secret,
        user: payload.user,
        error: undefined,
        countDown: undefined,
        codeTimestamp: Date.now(),
        loading: false,
      };
    case 'error':
      return {
        ...state,
        error: payload,
        countDown: COUNTDOWN,
      };
    case 'decrementCountDown':
      return {
        ...state,
        countDown: (state.countDown || COUNTDOWN) - 1,
      };
    case 'disable':
      return {
        tenant: state.tenant,
        isDeviceCode: false,
        baseUrl: state.baseUrl,
        user: state.user,
      };
    default:
      return state;
  }
}

function hasValidRoles({
  acceptedRolesArray,
  roles,
}: {
  acceptedRolesArray?: string[];
  roles: any[];
}): boolean {
  if (!acceptedRolesArray || acceptedRolesArray.length === 0) {
    return true;
  }
  const authorities: string[] = roles.map((r) => r.role);
  const rolesIntersection = acceptedRolesArray.filter((value) =>
    authorities.includes(value),
  );
  const isAuthorized = rolesIntersection.length > 0; //authorities.includes(role);
  return isAuthorized;
}

function checkDisallowedRoles({
  roles,
  disallowedRoles,
}: {
  roles: Array<{ role: string }>;
  disallowedRoles?: RegExp[];
}): string[] {
  if (!disallowedRoles || disallowedRoles.length === 0) {
    return [];
  }
  return roles
    .map((r) => r.role)
    .filter((role) => disallowedRoles.some((regExp) => regExp.test(role)));
}

export default function AuthWrapper(props: IAuthProps) {
  const refreshStorageHandler =
    props.refreshStorageHandler || _refreshStorageHandler;
  const _configContext = useContext(ConfigContext);
  if (!_configContext) {
    return <Fragment>Configuration should be provided</Fragment>;
  }
  const config: IConfig = _configContext;
  const { baseUrl, tenant } = config;
  const api = useMemo(() => axios.create({ baseURL: baseUrl }), [baseUrl]);
  const [auth, setAuth] = useState<AuthWrapperStateStruct>({
    loggedIn: false,
    UUID: '',
  });

  const [resolved, setResolved] = useState<boolean>(false);
  const [state, dispatch] = useReducer(deviceLoginReducer, {
    isDeviceCode: false,
    tenant: tenant,
    baseUrl: baseUrl,
  });
  const [disallowedRoles, setDisallowedRoles] = useState<string[] | null>(null);

  function onSignOut() {
    console.log('--- log out ----');
    setAuth({ loggedIn: false, UUID: '' });
    setResolved(true);
    orderingCore.clearAuthData(config.tenant, refreshStorageHandler);
  }

  async function getUserData(
    baseUrl: string,
    authProvider: orderingCore.IConfiguredAuthDataProvider,
    setAuth: Function,
  ) {
    let haveToken = false;
    try {
      const { UUID, token } = await authProvider();
      if (token) {
        const userData = await orderingCore.getLoggedUserData(baseUrl, token);
        if (
          !hasValidRoles({
            acceptedRolesArray: props.roles,
            roles: userData.roles,
          })
        ) {
          console.warn('--- USER HAS NO REQUIRED ROLES ----- ');
          onSignOut();
          setResolved(true);
          alert('User has no required roles');
          return false;
        }
        const userDisallowedRoles = checkDisallowedRoles({
          roles: userData.roles,
          disallowedRoles: props.disallowedRoles,
        });
        if (userDisallowedRoles.length) {
          console.warn(
            '--- USER HAS DISALLOWED ROLES ----- ',
            userDisallowedRoles,
          );
          props.appInsights?.trackTrace({
            message: 'Front user has disallowed roles',
            severityLevel: 2, // Warning
            properties: {
              uuid: UUID,
              roles: userData.roles,
              userDisallowedRoles,
            },
          });
          if (props.logoutOnDisallowedRoles) {
            setDisallowedRoles(userDisallowedRoles);
            onSignOut();
            setResolved(true);
            return false;
          }
        }

        setAuth({
          loggedIn: true,
          email: userData.login,
          UUID: UUID,
          authProvider: authProvider,
          signOut: onSignOut,
        });
        haveToken = true;
      }
    } catch (err) {
      onSignOut();
    }
    setResolved(true);
    return haveToken;
  }

  async function deviceCodeLogin(
    authProvider: orderingCore.IConfiguredAuthDataProvider,
    moduleId: string,
  ) {
    dispatch({ type: 'enable' });
    while (true) {
      try {
        dispatch({ type: 'loading' });
        // Get code
        const {
          data: { code, secret, user },
        } = await api.get<{
          code: string;
          secret: string;
          module: string;
          user: string | null;
          verifyUri: string;
        }>('/auth-oauth2/device/code', {
          params: {
            module: moduleId,
            tenant,
          },
        });
        dispatch({ type: 'setValues', payload: { code, secret, user } });

        // Await code verification, timeout or error
        const { data } = await api.post<SuccessData | ErrorData>(
          '/auth-oauth2/device/code',
          {
            code,
            secret,
            tenant,
          },
        );
        if (!isSuccess(data)) {
          dispatch({ type: 'error', payload: data.error });
        } else {
          await refreshStorageHandler.setRefreshToken(
            data.TENANT,
            data.refresh_token,
          );
          break;
        }
      } catch (e: any) {
        const message = getErrorMessage(e);
        if (message) {
          dispatch({ type: 'error', payload: message });
          for (let i = 0; i < COUNTDOWN - 1; i += 1) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            dispatch({ type: 'decrementCountDown' });
          }
        }
        console.warn(e);
        // continue loop
      }
    }
    dispatch({ type: 'disable' });
  }

  useEffect(() => {
    async function init() {
      //console.log("AutWrapper init --- ");
      const authProvider: orderingCore.IConfiguredAuthDataProvider =
        orderingCore.createAuthDataProvider(
          {
            BASE_URL: config.baseUrl,
            TENANT: config.tenant,
            BASIC_AUTH: config.basicAuth,
            anonymousAuth: config.anonymousOnInit,
          },
          refreshStorageHandler,
          false,
        );

      const params = new URLSearchParams(window.location.search);
      const moduleId = params.get('module');
      const isDeviceCodeMode =
        !!moduleId && params.get('deviceCode') === 'true';
      const { token } = await authProvider();

      if (isDeviceCodeMode && !token) {
        await deviceCodeLogin(authProvider, moduleId);
      }

      // Check for refreshToken in search params
      try {
        const refreshToken = params.get('refreshToken');
        if (refreshToken) {
          refreshStorageHandler.setRefreshToken(config.tenant, refreshToken);

          // Remove refresh token from search params
          params.delete('refreshToken');
          const url = `${window.location.origin}${
            window.location.pathname
          }?${params.toString()}`;
          window.history.replaceState(null, '', url);
        }
      } catch (e) {
        console.warn(e);
      }

      getUserData(config.baseUrl, authProvider, setAuth);

      window.addEventListener('message', function (event) {
        if (event.origin !== config.baseUrl) return;
        const authData = event.data;
        console.log(authData);
        if (authData.UUID === '') {
          setAuth({ loggedIn: false, UUID: '' });
        } else {
          orderingCore.setAuthData(
            config.tenant,
            {
              UUID: authData.UUID,
              access_token: authData.access_token,
              refresh_token: authData.refresh_token,
              expires_in: authData.expires_in,
            },
            refreshStorageHandler,
          );
          setAuth({
            loggedIn: true,
            UUID: authData.UUID,
            authProvider: authProvider,
            signOut: onSignOut,
          });
          getUserData(config.baseUrl, authProvider, setAuth);
        }
      });
    }
    init();
  }, []);

  if (state.isDeviceCode) {
    const DeviceCodeComp = props.DeviceCodeComp || DefaultDeviceCodeComp;
    return <DeviceCodeComp {...state} />;
  }

  if (disallowedRoles?.length) {
    const DisallowedRolesComp =
      props.DisallowedRolesComp || DefaultDisallowedRolesComp;
    return <DisallowedRolesComp />;
  }

  return (
    <Fragment>
      <AuthContext.Provider value={{ ...auth, resolved }}>
        {props.children}
      </AuthContext.Provider>
    </Fragment>
  );
}

export function ShowWhenAuthenticated(props: any) {
  const { loggedIn } = useContext(AuthContext);
  return loggedIn ? <Fragment>{props.children}</Fragment> : null;
}

export function ShowWhenNotAuthenticated(props: any) {
  const { loggedIn } = useContext(AuthContext);
  return !loggedIn ? <Fragment>{props.children}</Fragment> : null;
}

export function ShowWhenNotAuthenticatedAnResolved(props: any) {
  const { loggedIn, resolved } = useContext(AuthContext);
  return !loggedIn && resolved ? <Fragment>{props.children}</Fragment> : null;
}

export function ShowWhenAuthenticating(props: any) {
  const { resolved } = useContext(AuthContext);
  return !resolved ? <Fragment>{props.children}</Fragment> : null;
}

function DefaultDisallowedRolesComp() {
  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '2vw',
        backgroundColor: 'white',
      }}
    >
      <div
        style={{
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <h1>Auth error 101. Contact support</h1>
      </div>
    </div>
  );
}
