import React from 'react';
import { Header } from './Header';
import { CodeEditor } from './editor';
// import { loadTheme } from '@uifabric/styling';
import './App.css';

// loadTheme({
//     palette:
// });

function App() {
  return (
    <div className="App">
        <Header/>
        <CodeEditor/>
    </div>
  );
}

export default App;
