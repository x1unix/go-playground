import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { VscAdd, VscRemove } from 'react-icons/vsc'
import { defaultEditorPreferences } from '~/lib/cm-react/props'
import { arithmeticFontScale, FONT_MAX, FONT_MIN } from '~/lib/cm-react/extensions/zoom'
import { defaultMonacoSettings } from '~/services/config/monaco'
import type { State } from '~/store/state'
import { newMonacoParamsChangeDispatcher } from '~/store/dispatchers/settings'
import { StatusBarItem } from './StatusBarItem'

import styles from './EditorZoomControls.module.css'

export const EditorZoomControls: React.FC = () => {
  const dispatch = useDispatch()
  const fontSize = useSelector(({ monaco }: State) => monaco.fontSize ?? defaultEditorPreferences.fontSize)
  const defaultSize = defaultMonacoSettings.fontSize ?? defaultEditorPreferences.fontSize
  const setFontSize = (size: number) => dispatch(newMonacoParamsChangeDispatcher({ fontSize: size }))

  return (
    <div className={styles.controls} role="group" aria-label="Editor zoom">
      <StatusBarItem
        button
        icon={VscRemove}
        iconOnly
        title="Zoom out editor"
        aria-label="Zoom out editor"
        disabled={fontSize <= FONT_MIN}
        onClick={() => setFontSize(arithmeticFontScale(fontSize, -1))}
      />
      <StatusBarItem
        button
        title={`Reset editor font size to ${defaultSize} px`}
        aria-label={`Reset editor font size to ${defaultSize} px`}
        onClick={() => setFontSize(defaultSize)}
      >
        {fontSize} px
      </StatusBarItem>
      <StatusBarItem
        button
        icon={VscAdd}
        iconOnly
        title="Zoom in editor"
        aria-label="Zoom in editor"
        disabled={fontSize >= FONT_MAX}
        onClick={() => setFontSize(arithmeticFontScale(fontSize, 1))}
      />
    </div>
  )
}
