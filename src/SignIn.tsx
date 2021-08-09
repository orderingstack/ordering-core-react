import React, { Fragment, useContext } from "react";
import ConfigContext, { IConfig } from "./ConfigContext";

export default function SignIn(props: any) {
  const _configContext = useContext(ConfigContext);
  if (!_configContext) {
    return <Fragment>Configuration shoud be provided</Fragment>;
  }
  const config: IConfig = _configContext;

  function onSignIn() {
    const url =
      config.baseUrl + "/user-service/auth-init/" + config.tenantAuthConfig;
    console.log(url);
    window.open(url, "signinwindow", "width=450,height=550");
  }
  return <button onClick={onSignIn}>Sign in / register</button>;
}
