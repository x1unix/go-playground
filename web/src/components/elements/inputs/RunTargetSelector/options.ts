import type React from 'react'
import { DropdownMenuItemType, type IDropdownOption } from '@fluentui/react'
import { VscBeaker, VscCloud } from 'react-icons/vsc'
import { SiWebassembly } from 'react-icons/si'
import environment from '~/environment'
import { TargetType } from '~/services/config/target'
import { Backend, type VersionsInfo } from '~/services/api'
import { removePatchVersion } from './utils'

const supportsWebAssembly = 'WebAssembly' in window

export enum OptionColors {
  Default = '#007fd4',
  WebAssembly = '#654ff0',
  Experimental = '#00CC6A',
}

export type DropdownOption = IDropdownOption<{
  type: TargetType
  backend?: Backend
  icon?: React.ComponentType
  description?: string
  iconColor?: string
}>

export const keyFromOption = (target: TargetType, version?: string): string => {
  if (!target) {
    return ''
  }

  if (!version) {
    return target
  }

  return `${target}.${version}`
}

export const createDropdownOptions = (
  currentVersion = environment.go.currentVersion,
  previousVersion = environment.go.currentVersion,
  wasmVersion = environment.go.currentVersion,
) => [
  {
    key: 'section-remote',
    text: 'Run on server',
    itemType: DropdownMenuItemType.Header,
  },
  {
    key: keyFromOption(TargetType.Server),
    text: `Go ${currentVersion}`,
    data: {
      icon: VscCloud,
      type: TargetType.Server,
      backend: Backend.Default,
      description: 'Run on server using current Go version.',
    },
  },
  {
    key: keyFromOption(TargetType.Server, 'goprev'),
    text: `Go ${previousVersion}`,
    data: {
      icon: VscCloud,
      type: TargetType.Server,
      backend: Backend.GoPrev,
      description: 'Run on server using previous Go version.',
    },
  },
  {
    key: keyFromOption(TargetType.Server, 'gotip'),
    text: 'Go dev branch',
    data: {
      icon: VscBeaker,
      iconColor: OptionColors.Experimental,
      type: TargetType.Server,
      backend: Backend.GoTip,
      description: 'Run on server using unstable dev branch.',
    },
  },
  { key: 'divider', text: '-', itemType: DropdownMenuItemType.Divider },
  {
    key: 'section-wasm',
    text: 'Run in browser',
    itemType: DropdownMenuItemType.Header,
  },
  {
    key: keyFromOption(TargetType.WebAssembly),
    text: `Go ${wasmVersion}`,
    disabled: !supportsWebAssembly,
    data: {
      icon: SiWebassembly,
      iconColor: OptionColors.WebAssembly,
      type: TargetType.WebAssembly,
      description: 'Run program in browser as WebAssembly module.',
    },
  },
]

export const dropdownOptionsFromResponse = ({
  playground: { current = environment.go.currentVersion, goprev = environment.go.previousVersion },
  wasm = environment.go.currentVersion,
}: VersionsInfo): DropdownOption[] =>
  createDropdownOptions(removePatchVersion(current), removePatchVersion(goprev), removePatchVersion(wasm))
