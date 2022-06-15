import React, { Fragment, useContext, useEffect, useState } from "react";
import AuthContext from "./AuthContext";
import ConfigContext, { IConfig } from "./ConfigContext";
import * as orderingCore from "@orderingstack/ordering-core";

const refreshStorageHandler: orderingCore.IRefreshTokenStorageHandler = {
  getRefreshToken: (tenant: string) => {
    return (
      window.localStorage.getItem(`orderingstack_${tenant}_refreshToken`) || ""
    );
  },
  setRefreshToken: (tenant: string, token: string) => {
    window.localStorage.setItem(`orderingstack_${tenant}_refreshToken`, token);
  },
  clearRefreshToken: (tenant: string) => {
    window.localStorage.removeItem(`orderingstack_${tenant}_refreshToken`);
  },
};

interface AuthWrapperStateStruct {
  loggedIn: boolean;
  UUID: string;
  email?: string;
  authProvider?: orderingCore.IConfiguredAuthDataProvider;
  signOut?: Function;
}

export default function AuthWrapper(props: any) {
  const _configContext = useContext(ConfigContext);
  if (!_configContext) {
    return <Fragment>Configuration shoud be provided</Fragment>;
  }
  const config: IConfig = _configContext;
  const [auth, setAuth] = useState<AuthWrapperStateStruct>({
    loggedIn: false,
    UUID: "",
  });

  function onSignOut() {
    console.log("--- log out ----");
    setAuth({ loggedIn: false, UUID: "" });
    orderingCore.clearAuthData(config.tenant, refreshStorageHandler);
  }

  function hasValidRoles(acceptedRolesArray: string[], roles: any[]): boolean {
    if (!acceptedRolesArray || acceptedRolesArray.length === 0) {
      return true;
    }
    const authorities: string[] = roles.map((r) => r.role);
    const rolesIntersection = acceptedRolesArray.filter((value) =>
      authorities.includes(value)
    );
    const isAuthorized = rolesIntersection.length > 0; //authorities.includes(role);
    return isAuthorized;
  }

  async function getUserData(
    baseUrl: string,
    authProvider: orderingCore.IConfiguredAuthDataProvider,
    setAuth: Function
  ) {
    try {
      const { UUID, token } = await authProvider();
      if (token) {
        const userData = await orderingCore.getLoggedUserData(baseUrl, token);
        if (!hasValidRoles(props.roles, userData.roles)) {
          console.log("--- USER HAS NO REQUIRED ROLES ----- ");
          onSignOut();
        }
        setAuth({
          loggedIn: true,
          email: userData.login,
          UUID: UUID,
          authProvider: authProvider,
          signOut: onSignOut,
        });
      }
    } catch (err) {
      onSignOut();
    }
  }

  useEffect(() => {
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
        false
      );
    try {
      const refreshToken = new URLSearchParams(window.location.search).get("refreshToken")
      if (refreshToken) {
        refreshStorageHandler.setRefreshToken(config.tenant, refreshToken)
      }
    } catch(e){
      console.warn(e)
    }

    getUserData(config.baseUrl, authProvider, setAuth);

    window.addEventListener("message", function (event) {
      if (event.origin !== config.baseUrl) return;
      const authData = event.data;
      console.log(authData);
      if (authData.UUID === "") {
        setAuth({ loggedIn: false, UUID: "" });
      } else {
        orderingCore.setAuthData(
          config.tenant,
          {
            UUID: authData.UUID,
            access_token: authData.access_token,
            refresh_token: authData.refresh_token,
            expires_in: authData.expires_in,
          },
          refreshStorageHandler
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
  }, []);

  return (
    <Fragment>
      <AuthContext.Provider value={auth}>{props.children}</AuthContext.Provider>
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

