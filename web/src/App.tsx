import React from 'react';
import { Provider } from 'react-redux';
import { ConnectedRouter } from 'connected-react-router';
import { Switch, Route } from "react-router-dom";
import { ThemeProvider } from '@fluentui/react';

import { configureStore, createGoConsoleAdapter } from './store';
import { history } from './store/configure';
import { bootstrapGo } from './services/go';
import Playground from '~/components/pages/Playground';
import config from './services/config';
import './App.css';

// Configure store and import config from localStorage
const store = configureStore();
config.sync();

// Bootstrap Go and storage bridge
bootstrapGo(createGoConsoleAdapter(a => store.dispatch(a)));

function App() {
  return (
    <Provider store={store}>
      <ConnectedRouter history={history}>
        <ThemeProvider className="App">
          <Switch>
            <Route
              path="/(snippet)?/:snippetID?"
              component={Playground}
            />
          </Switch>
        </ThemeProvider>
      </ConnectedRouter>
    </Provider>
  );
}

export default App;
