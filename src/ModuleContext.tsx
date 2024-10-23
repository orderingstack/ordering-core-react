import React from 'react';
import { IModule } from '@orderingstack/ordering-types';

export type ModuleConfig = Pick<
  IModule,
  'id' | 'type' | 'venue' | 'production' | 'config'
> & {
  configSignature: string;
};

export const ModuleContext = React.createContext<ModuleConfig | undefined>(
  undefined,
);

export function useModule() {
  return React.useContext(ModuleContext);
}
