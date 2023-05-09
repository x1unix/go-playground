import React from "react";
import {DropdownMenuItemType, IDropdownOption} from "@fluentui/react";
import {VscBeaker, VscCloud} from "react-icons/vsc";
import {SiWebassembly} from "react-icons/si";
import environment from "~/environment";

const supportsWebAssembly = 'WebAssembly' in window;

export enum OptionColors {
  Default = '#007fd4',
  WebAssembly = '#654ff0',
  Experimental = '#00CC6A'
}

export enum EvalType {
  Empty,
  Remote = 'remote',
  WebAssemblyCompiler = 'wasmCompiler',
  WebAssemblyInterpreter = 'wasmInterpreter'
}

export interface EnvironmentOption {
  type: EvalType
  version?: string
}

export type DropdownOption = IDropdownOption<{
  type: EvalType
  version?: string
  icon?: React.ComponentType
  description?: string
  iconColor?: string
}>;

export const keyFromOption = (type: EvalType, version?: string): string => {
  const prefix = type;
  // const prefix = EvalType[type];
  if (!prefix) {
    return '';
  }

  if (!version) {
    return prefix;
  }

  return `${prefix}.${version}`;
}

export const dropdownOptions: DropdownOption[] = [
  {
    key: 'section-remote',
    text: 'Run on server',
    itemType: DropdownMenuItemType.Header
  },
  {
    key: keyFromOption(EvalType.Remote),
    text: `Go ${environment.go.currentVersion}`,
    data: {
      icon: VscCloud,
      type: EvalType.Remote,
      description: 'Run on server using current Go version.'
    }
  },
  {
    key: keyFromOption(EvalType.Remote, 'goprev'),
    text: `Go ${environment.go.previousVersion}`,
    data: {
      icon: VscCloud,
      type: EvalType.Remote,
      version: 'goprev',
      description: 'Run on server using previous Go version.'
    }
  },
  {
    key: keyFromOption(EvalType.Remote, 'gotip'),
    text: 'Go dev branch',
    data: {
      icon: VscBeaker,
      iconColor: OptionColors.Experimental,
      type: EvalType.Remote,
      version: 'gotip',
      description: 'Run on server using unstable dev branch.'
    }
  },
  { key: 'divider', text: '-', itemType: DropdownMenuItemType.Divider },
  {
    key: 'section-wasm',
    text: 'Run in browser',
    itemType: DropdownMenuItemType.Header
  },
  {
    key: keyFromOption(EvalType.WebAssemblyCompiler),
    text: 'WebAssembly',
    disabled: !supportsWebAssembly,
    data: {
      icon: SiWebassembly,
      iconColor: OptionColors.WebAssembly,
      type: EvalType.WebAssemblyCompiler,
      description: 'Build program on server but execute it in a browser.'
    }
  },
  {
    key: keyFromOption(EvalType.WebAssemblyInterpreter),
    text: 'Go Interpreter',
    disabled: !supportsWebAssembly,
    data: {
      icon: SiWebassembly,
      iconColor: OptionColors.WebAssembly,
      type: EvalType.WebAssemblyInterpreter,
      description: 'Use Yaegi Go interpreter to run code. Works offline.'
    }
  },
];
