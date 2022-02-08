import React from 'react';
import ReactDOM from 'react-dom';
import { initializeIcons } from '@fluentui/react/lib/Icons';
import { registerGoLanguageProvider } from '~/components/editor/provider';
import apiClient from '~/services/api';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import App from './App';
import './index.css';


initializeIcons();
registerGoLanguageProvider(apiClient);

ReactDOM.render(<App />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
serviceWorkerRegistration.register();
