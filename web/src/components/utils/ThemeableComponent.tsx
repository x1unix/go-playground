import React from 'react'
import { type ITheme, ThemeContext } from '@fluentui/react'

export class ThemeableComponent<P = any, S = any> extends React.Component<P, S> {
  static contextType = ThemeContext

  get theme() {
    return this.context as ITheme
  }
}
