import React, { Fragment, ReactNode, useContext, useEffect, useState } from 'react';
import AuthContext from "./AuthContext";
import OrdersContext from "./OrdersContext";
import ConfigContext, { IConfig } from "./ConfigContext";
import * as orderingCore from "@orderingstack/ordering-core";
import { INotificationMessage, ISteeringCommand } from '@orderingstack/ordering-types';

export interface OrderProviderProps {
  children: ReactNode;
  onWebsocketNotification?: (message:INotificationMessage) => void;
  onSteeringCommand?: (command: ISteeringCommand) => void;}

export default function OrderProvider(props: OrderProviderProps) {
  const _configContext = useContext(ConfigContext);
  if (!_configContext) {
    return (<Fragment>Configuration should be provided</Fragment>)
  }
  const config: IConfig = _configContext;

  const [orders, setOrders] = useState<any>({});
  const { authProvider, loggedIn } = useContext( AuthContext);

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
          config.enableKDS,
          props.onWebsocketNotification,
          props.onSteeringCommand
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
