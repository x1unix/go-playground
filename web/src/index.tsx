import React from 'react'
import ReactDOM from 'react-dom'
import { initializeIcons } from '@fluentui/react/lib/Icons'
import { registerGoLanguageProvider } from '~/components/features/workspace/provider'
import apiClient from '~/services/api'
import * as serviceWorkerRegistration from './serviceWorkerRegistration'
import { App } from './App'
import './index.css'

// Polyfills
import 'core-js/actual/promise/all-settled'
import 'core-js/actual/array/flat-map'

initializeIcons()
registerGoLanguageProvider(apiClient)

// eslint-disable-next-line import/no-named-as-default-member
ReactDOM.render(<App />, document.getElementById('root'))

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
serviceWorkerRegistration.register({
  onUpdate: (registration) => {
    registration.update().catch((err) => {
      console.error('Failed to check updates: ', err)
    })
  },
})
