import React, {
  Fragment,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import AuthContext from './AuthContext';
import OrdersContext from './OrdersContext';
import ConfigContext, { IConfig } from './ConfigContext';
import * as orderingCore from '@orderingstack/ordering-core';
import {
  INotificationMessage,
  ISteeringCommand,
} from '@orderingstack/ordering-types';
import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { IOrderRec } from '@orderingstack/ordering-core';

export interface OrderProviderProps {
  children: ReactNode;
  onWebsocketNotification?: (message: INotificationMessage) => void;
  onSteeringCommand?: (command: ISteeringCommand) => void;
  appInsights?: ApplicationInsights;
  debugWs?: boolean;
  onlyCompletedOrdersForUser?: boolean;
}

export default function OrderProvider(props: OrderProviderProps) {
  const _configContext = useContext(ConfigContext);
  if (!_configContext) {
    return <Fragment>Configuration should be provided</Fragment>;
  }
  const config: IConfig = _configContext;

  const [orders, setOrders] = useState<{
    orderRecMap: Record<string, IOrderRec>;
    loaded: boolean;
    error?: any;
  }>({ orderRecMap: {}, loaded: false });
  const { authProvider, loggedIn } = useContext(AuthContext);

  const onOrdersUpdated = (
    order: IOrderRec | undefined,
    allOrders: Record<string, IOrderRec>,
  ) => {
    //console.log("--------------" + Object.keys(allOrders).length);
    setOrders({
      orderRecMap: { ...allOrders },
      loaded: true,
      error: undefined,
    });
  };

  async function setOrderChangesListener(
    authProvider: orderingCore.IConfiguredAuthDataProvider,
  ) {
    let disconnect: () => Promise<void> = () => {
      return Promise.resolve();
    };
    try {
      const { token } = await authProvider();
      if (token) {
        disconnect = await orderingCore.orderChangesListener(
          config.baseUrl,
          config.tenant,
          config.venue,
          authProvider,
          onOrdersUpdated,
          () => {
            setOrders({
              orderRecMap: {},
              loaded: false,
              error: new Error('auth failure'),
            });
            return Promise.resolve();
          },
          config.enableKDS,
          props.onWebsocketNotification,
          props.onSteeringCommand,
          {
            appInsights: props.appInsights,
            debugWs: props.debugWs,
            onlyCompletedOrdersForUser: props.onlyCompletedOrdersForUser,
          },
        );
      }
    } catch (err) {
      setOrders({ orderRecMap: {}, loaded: false, error: err });
    }
    return disconnect;
  }

  useEffect(() => {
    orderingCore.setOrderStoreUpdatedCallback(onOrdersUpdated);
    const promise = setOrderChangesListener(authProvider!);
    return () => {
      promise.then((disconnect) => disconnect());
    };
  }, [loggedIn]);

  return (
    <Fragment>
      <OrdersContext.Provider value={orders}>
        {props.children}
      </OrdersContext.Provider>
    </Fragment>
  );
}
