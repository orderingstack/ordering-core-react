import React, { Fragment } from "react";
import ConfigContext, { IConfig } from "./ConfigContext";

export interface ConfigProps {
  data: IConfig,
  children: React.ReactNode
}

export default function Config({data, children}:ConfigProps) {
    return (
    <Fragment>
      <ConfigContext.Provider value={data}>
        {children}
      </ConfigContext.Provider>
    </Fragment>
  );
}