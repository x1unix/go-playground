import React from 'react'
import { act, cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { applyMiddleware, createStore } from 'redux'
import thunk from 'redux-thunk'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { EditorView } from '@codemirror/view'
import config, { defaultMonacoSettings, type MonacoSettings } from '~/services/config'
import { ActionType, newMonacoParamsChangeAction } from '~/store/actions'
import { newMonacoParamsChangeDispatcher } from '~/store/dispatchers/settings'
import { newEditorZoomListener } from '~/lib/cm-react/extensions/hotkeys'
import { EditorZoomControls } from './EditorZoomControls'

const renderControls = () => {
  const store = createStore(
    (
      state: { monaco: MonacoSettings } = { monaco: config.monacoSettings },
      action: ReturnType<typeof newMonacoParamsChangeAction>,
    ) =>
      action.type === ActionType.MONACO_SETTINGS_CHANGE ? { monaco: { ...state.monaco, ...action.payload } } : state,
    applyMiddleware(thunk),
  )
  render(
    <Provider store={store}>
      <EditorZoomControls />
    </Provider>,
  )
  return store
}

beforeEach(() => {
  localStorage.clear()
  config._cache.clear()
})

afterEach(cleanup)

describe('EditorZoomControls', () => {
  test('adjusts, resets and persists font size without changing defaults', async () => {
    const user = userEvent.setup()
    const store = renderControls()
    await user.click(screen.getByRole('button', { name: 'Zoom in editor' }))
    expect(store.getState().monaco.fontSize).toBe(13.4)
    expect(defaultMonacoSettings.fontSize).toBe(12)
    await user.click(screen.getByRole('button', { name: 'Zoom out editor' }))
    expect(store.getState().monaco.fontSize).toBe(12)
    await user.click(screen.getByRole('button', { name: 'Zoom out editor' }))
    expect(store.getState().monaco.fontSize).toBe(10.6)
    await user.click(screen.getByRole('button', { name: 'Reset editor font size to 12 px' }))
    expect(store.getState().monaco.fontSize).toBe(12)
    config._cache.clear()
    expect(config.monacoSettings.fontSize).toBe(12)
  })

  test('reflects pinch zoom and resets it using the keyboard', async () => {
    const user = userEvent.setup()
    const store = renderControls()
    const view = new EditorView({
      extensions: [
        newEditorZoomListener({
          currentSize: () => store.getState().monaco.fontSize!,
          handler: (fontSize) => store.dispatch(newMonacoParamsChangeDispatcher({ fontSize }) as any),
        }),
      ],
    })
    try {
      act(() => {
        view.contentDOM.dispatchEvent(new WheelEvent('wheel', { deltaY: -1, ctrlKey: true, cancelable: true }))
      })
      expect(screen.getByRole('button', { name: 'Reset editor font size to 12 px' })).toHaveTextContent('13.4 px')
      await user.tab()
      await user.tab()
      expect(screen.getByRole('button', { name: 'Reset editor font size to 12 px' })).toHaveFocus()
      await user.keyboard('{Enter}')
      expect(store.getState().monaco.fontSize).toBe(12)
    } finally {
      view.destroy()
    }
  })

  test.each([
    [7.5, 'Zoom out editor', 7],
    [41.5, 'Zoom in editor', 42],
  ])('clamps %s px at the zoom limit', async (fontSize, buttonName, expected) => {
    config.monacoSettings = { ...defaultMonacoSettings, fontSize }
    const user = userEvent.setup()
    const store = renderControls()
    const button = screen.getByRole('button', { name: buttonName })
    await user.click(button)
    expect(store.getState().monaco.fontSize).toBe(expected)
    expect(button).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Reset editor font size to 12 px' }))
    expect(store.getState().monaco.fontSize).toBe(12)
  })

  test('uses the same fallback size as the editor for legacy settings', () => {
    config.monacoSettings = { ...defaultMonacoSettings, fontSize: undefined }
    renderControls()
    expect(screen.getByRole('button', { name: 'Reset editor font size to 12 px' })).toHaveTextContent('14 px')
  })
})
