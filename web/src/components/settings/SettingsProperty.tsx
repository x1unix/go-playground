import { settingsPropStyles } from './styles'
import React from 'react';

interface SettingsSectionProps {
  title: string
  description?: string
  control: JSX.Element
}

export default function SettingsProperty(props: SettingsSectionProps) {
  if (props.description) {
    return (
      <div className={settingsPropStyles.block}>
        <div className={settingsPropStyles.title}>{props.title}</div>
        <div className={settingsPropStyles.description}>{props.description}</div>
        <div className={settingsPropStyles.container}>
          {props.control}
        </div>
      </div>
    )
  }

  return (
    <div className={settingsPropStyles.block}>
      <div className={settingsPropStyles.title}>{props.title}</div>
      <div className={settingsPropStyles.container}>
        {props.control}
      </div>
    </div>
  )
}
