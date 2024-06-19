import { IOrderRec } from '@orderingstack/ordering-core';
import React from 'react';

export default React.createContext<{
  orderRecMap: {
    [id: string]: IOrderRec;
  };
  loaded: boolean;
  error?: any;
}>({ orderRecMap: {}, loaded: false });
