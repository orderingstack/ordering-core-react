import React, { Fragment } from "react";
import PropTypes from "prop-types";
import ConfigContext, { IConfig } from "./ConfigContext";

export default function Config(props:any) {
  const conf: IConfig = props.data;
  return (
    <Fragment>
      <ConfigContext.Provider value={conf}>
        {props.children}
      </ConfigContext.Provider>
    </Fragment>
  );
}

// Config.propTypes = {
//   data: PropTypes.any
// };
