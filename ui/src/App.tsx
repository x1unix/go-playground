import React from 'react';
import { Provider } from 'react-redux';
import { loadTheme } from '@uifabric/styling';

import { store } from './store';
import { Header } from './Header';
import { LightTheme, DarkTheme } from './services/colors';
import CodeEditor from './editor/CodeEditor';
import './App.css';
import Preview from './Preview';

const changeFabricTheme = () => {
    const { darkMode } = store.getState();
    loadTheme(darkMode ? DarkTheme : LightTheme);
};
store.subscribe(changeFabricTheme);
changeFabricTheme();

function App() {
  return (
    <Provider store={store}>
        <div className="App">
            <Header/>
            <CodeEditor />
            <Preview />
        </div>
    </Provider>
  );
}

export default App;
