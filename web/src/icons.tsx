import React from 'react'
import { initializeIcons as initFluentIcons } from '@fluentui/react/lib/Icons'
import { registerIcons } from '@fluentui/react/lib/Styling'
import { SiWebassembly, SiAzurefunctions } from 'react-icons/si'
import { VscSymbolClass, VscSymbolMisc, VscBracketError, VscSymbolParameter, VscRegex, VscPulse } from 'react-icons/vsc'
import { BsFillDice3Fill } from 'react-icons/bs'

export const initializeIcons = () => {
  initFluentIcons()
  registerIcons({
    icons: {
      SiWebassembly: <SiWebassembly />,
      VscSymbolClass: <VscSymbolClass />,
      VscBracketError: <VscBracketError />,
      SiAzurefunctions: <SiAzurefunctions />,
      VscSymbolParameter: <VscSymbolParameter />,
      BsFillDice3Fill: <BsFillDice3Fill />,
      VscRegex: <VscRegex />,
      VscSymbolMisc: <VscSymbolMisc />,
      VscPulse: <VscPulse />,
    },
  })
}
