import React from 'react';
import { Provider } from 'react-redux';

import { store } from './store';
import { Header } from './Header';
import CodeEditor from './editor/CodeEditor';
import './App.css';
import Preview from './Preview';

// import { loadTheme } from '@uifabric/styling';

// loadTheme({
//     palette:
// });

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
