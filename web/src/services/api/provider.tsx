import React, {createContext, useContext} from "react";

import { IAPIClient } from "./interface";
import clientInstance from "./singleton";

export const ApiClientContext = createContext<IAPIClient>(clientInstance);

/**
 * Returns API client from ApiContext
 */
export const useApiClient = () => useContext<IAPIClient>(ApiClientContext);

/**
 * ApiClientProvider provides API client context
 *
 * @param children
 * @constructor
 */
export const ApiClientProvider: React.FC = ({children}) => (
  <ApiClientContext.Provider value={clientInstance}>
    {children}
  </ApiClientContext.Provider>
);
