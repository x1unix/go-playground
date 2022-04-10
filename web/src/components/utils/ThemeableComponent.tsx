import React from 'react';
import {ITheme, ThemeContext} from '@fluentui/react';

export default class ThemeableComponent<P=any, S=any> extends React.Component<P, S> {
  static contextType = ThemeContext;

  get theme() {
    return this.context as ITheme;
  }
}
