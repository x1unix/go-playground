import React from 'react'
import { settingsSectionStyles } from './styles'

interface SettingsSectionProps {
  title: string
  children: JSX.Element | JSX.Element[]
}

export default function SettingsSection(props: SettingsSectionProps) {
  return (
    <div className={settingsSectionStyles.section}>
      <div className={settingsSectionStyles.title}>{props.title}</div>
      {props.children}
    </div>
  )
}
