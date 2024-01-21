import React from 'react';
import { Provider } from 'react-redux';
import { ConnectedRouter } from 'connected-react-router';
import { Switch, Route } from 'react-router-dom';

import {
  configureStore,
  createGoConsoleAdapter,
  createGoLifecycleAdapter
} from './store';
import { history } from '~/store/configure';
import { bootstrapGo } from '~/services/go';
import config from './services/config';
import { PlaygroundPage } from '~/components/pages/PlaygroundPage';
import { NotFoundPage } from "~/components/pages/NotFoundPage";
import { ConnectedThemeProvider } from '~/components/utils/ConnectedThemeProvider';
import {ApiClientProvider} from '~/services/api';

import './App.css';

// Configure store and import config from localStorage
const store = configureStore();
config.sync();

// Bootstrap Go and storage bridge
bootstrapGo(
  createGoConsoleAdapter(a => store.dispatch(a)),
  createGoLifecycleAdapter(a => store.dispatch(a))
);

export const App = () => {
  return (
    <Provider store={store}>
      <ApiClientProvider>
        <ConnectedRouter history={history}>
          <ConnectedThemeProvider className="App">
            <Switch>
              <Route
                path={[
                  "/",
                  "/snippet/:snippetID"
                ]}
                exact
                component={PlaygroundPage}
              />
              <Route path="*" component={NotFoundPage}/>
            </Switch>
          </ConnectedThemeProvider>
        </ConnectedRouter>
      </ApiClientProvider>
    </Provider>
  );
}
