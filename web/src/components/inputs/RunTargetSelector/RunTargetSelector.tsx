import clsx from "clsx";
import React, {useMemo} from 'react';
import {connect} from "react-redux";
import {Dropdown, IDropdownStyles} from '@fluentui/react';
import {
  newRunTargetChangeDispatcher,
  State,
  StateDispatch
} from "~/store";
import {RunTargetConfig} from "~/services/config";

import {DropdownOption, dropdownOptions, keyFromOption} from "./options";
import {onRenderOption, onRenderTitle} from "./dropdown";

import "./RunTargetSelector.css";

const dropdownStyles: Partial<IDropdownStyles> = {
  callout: {
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

interface OwnProps {
  disabled?: boolean
  responsive?: boolean
}

interface StateProps {
  runTarget: RunTargetConfig
}

interface Props extends OwnProps, StateProps {
  dispatch: StateDispatch
}

const RunTargetSelector: React.FC<Props> = ({
  responsive,
  disabled,
  runTarget,
  dispatch
}) => {
  const selectedKey = useMemo(() => (
    keyFromOption(runTarget.target, runTarget.backend)
  ), [runTarget]);

  return (
    <Dropdown
      className={clsx({
        'RunTargetSelector--responsive': responsive
      })}
      options={dropdownOptions}
      selectedKey={selectedKey}
      onRenderTitle={(opt) => onRenderTitle(opt, disabled)}
      onRenderOption={onRenderOption}
      disabled={disabled}
      styles={dropdownStyles}
      onChange={(_, opt) => {
        if (!opt?.data) {
          return;
        }

        const {data} = opt as DropdownOption;
        dispatch(newRunTargetChangeDispatcher({
          target: data!.type,
          backend: data!.backend,
        }));
      }}
    />
  )
}

const ConnectedRunTargetSelector = connect<StateProps, any, OwnProps, State>
(({runTarget}) => ({runTarget}))(
  RunTargetSelector as any // Temporary hack to avoid TS complains on StateDispatch.
);

export default ConnectedRunTargetSelector;
