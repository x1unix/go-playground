import React from 'react'
import { initializeIcons as initFluentIcons } from '@fluentui/react/lib/Icons'
import { registerIcons } from '@fluentui/react/lib/Styling'
import { SiWebassembly } from 'react-icons/si'
import type { JSXElement } from '@fluentui/utilities'
import {
  VscSymbolArray,
  VscSymbolClass,
  VscSymbolEvent,
  VscSymbolMisc,
  VscBracketError,
  VscSymbolParameter,
  VscRegex,
  VscPulse,
  VscGithubInverted,
} from 'react-icons/vsc'
import { BsFillDice3Fill } from 'react-icons/bs'

const toJsxElement = (Icon: unknown) => React.createElement(Icon as React.ComponentType) as JSXElement

export const initializeIcons = () => {
  initFluentIcons()
  registerIcons({
    icons: {
      SiWebassembly: toJsxElement(SiWebassembly),
      VscSymbolClass: toJsxElement(VscSymbolClass),
      VscSymbolEvent: toJsxElement(VscSymbolEvent),
      VscBracketError: toJsxElement(VscBracketError),
      VscSymbolParameter: toJsxElement(VscSymbolParameter),
      BsFillDice3Fill: toJsxElement(BsFillDice3Fill),
      VscRegex: toJsxElement(VscRegex),
      VscSymbolMisc: toJsxElement(VscSymbolMisc),
      VscPulse: toJsxElement(VscPulse),
      VscGithubInverted: toJsxElement(VscGithubInverted),
      VscSymbolArray: toJsxElement(VscSymbolArray),
    },
  })
}
