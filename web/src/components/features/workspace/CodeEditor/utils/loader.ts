import { loader } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'

import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'

let loaderConfigured = false
export const configureMonacoLoader = () => {
  if (loaderConfigured) {
    return
  }

  loader.config({ monaco })
  loaderConfigured = true
}

self.MonacoEnvironment = {
  getWorker: () => {
    return new EditorWorker()
  },
}
