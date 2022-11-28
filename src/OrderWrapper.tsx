import React, { Fragment, useContext, useEffect, useState } from "react";
import AuthContext from "./AuthContext";
import OrdersContext from "./OrdersContext";
import ConfigContext, { IConfig } from "./ConfigContext";
import * as orderingCore from "@orderingstack/ordering-core";

export default function OrderWrapper(props: any) {
  const _configContext = useContext(ConfigContext);
  if (!_configContext) {
    return (<Fragment>Configuration should be provided</Fragment>)
  }
  const config: IConfig = _configContext;

  const [orders, setOrders] = useState<any>({});
  const { authProvider, loggedIn } = useContext(props.authContext || AuthContext);

  const onOrdersUpdated = (order: any, allOrders: any) => {
    //console.log("--------------" + Object.keys(allOrders).length);
    setOrders({ ...allOrders });
  };

  async function setOrderChangesListener(
    authProvider: orderingCore.IConfiguredAuthDataProvider
  ) {
    try {
      const { token } = await authProvider();
      if (token) {
        orderingCore.orderChangesListener(
          config.baseUrl,
          config.tenant,
          config.venue,
          authProvider,
          onOrdersUpdated,
          () => {
            setOrders({});
          },
          config.enableKDS
        );
      }
    } catch (err) {
      setOrders({});
    }
  }

  useEffect(() => {
    orderingCore.setOrderStoreUpdatedCallback(onOrdersUpdated);
    setOrderChangesListener(authProvider);
  }, [loggedIn]);

  return (
    <Fragment>
      <OrdersContext.Provider value={orders}>
        {props.children}
      </OrdersContext.Provider>
    </Fragment>
  );
}
