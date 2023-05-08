import clsx from "clsx";
import React, {useState} from 'react';
import {Dropdown, IDropdownStyles} from '@fluentui/react';

import {dropdownOptions, EvalType, keyFromOption} from "./options";
import {onRenderOption, onRenderTitle} from "./dropdown";

import './EnvironmentSelector.css'

const dropdownStyles: Partial<IDropdownStyles> = {
  callout: {
    // backgroundColor: "red",
    minWidth: "256px"
  },
  dropdownOptionText: { overflow: 'visible', whiteSpace: 'normal' },
  dropdownItem: {
    height: 'auto',
    paddingTop: ".3rem",
    paddingBottom: ".3rem"
  },
  dropdownItemSelected: {
    height: 'auto',
    paddingTop: ".3rem",
    paddingBottom: ".3rem"
  },
};

interface Props {
  disabled?: boolean
  responsive?: boolean
}

const EnvironmentSelector: React.FC<Props> = ({responsive, disabled}) => {
  const [currentValue, setValue] = useState(keyFromOption(EvalType.Remote));

  return (
    <Dropdown
      className={clsx({
        'EnvironmentSelector--responsive': responsive
      })}
      options={dropdownOptions}
      selectedKey={currentValue}
      onRenderTitle={onRenderTitle}
      onRenderOption={onRenderOption}
      disabled={disabled}
      styles={dropdownStyles}
      onChange={(_, opt) => {
        if (!opt) {
          return;
        }

        setValue(keyFromOption(opt.data.type, opt.data.version));
        console.log(opt);
      }}
    />
  )
}

export default EnvironmentSelector;
