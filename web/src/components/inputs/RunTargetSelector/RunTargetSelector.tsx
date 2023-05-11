import clsx from "clsx";
import React, { useMemo } from 'react';
import {Dropdown, IDropdownStyles} from '@fluentui/react';
import {RunTargetConfig} from "~/services/config";
import {
  StateDispatch,
  connect,
  newRunTargetChangeDispatcher,
} from "~/store";

import {onRenderOption, onRenderTitle} from "./dropdown";
import {
  createDropdownOptions,
  DropdownOption,
  dropdownOptionsFromResponse,
  keyFromOption,
} from "./options";

import "./RunTargetSelector.css";
import {VersionsInfo} from "@services/api";

const dropdownStyles: Partial<IDropdownStyles> = {
  callout: {
    minWidth: "256px"
  },
  dropdown: {
    maxWidth: "10rem"
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
  goVersions?: VersionsInfo
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
  goVersions,
  dispatch
}) => {
  const selectedKey = useMemo(() => (
    keyFromOption(runTarget.target, runTarget.backend)
  ), [runTarget]);

  // FIXME: investigate what causes multiple component remount from Header
  const options = useMemo<DropdownOption[]>(() => {
    return goVersions ?
      dropdownOptionsFromResponse(goVersions) :
      createDropdownOptions();
  }, [goVersions]);

  return (
    <Dropdown
      className={clsx({
        'RunTargetSelector--responsive': responsive
      })}
      options={options}
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

const ConnectedRunTargetSelector = connect<StateProps, OwnProps>
(({runTarget}) => ({runTarget}))(
  RunTargetSelector
);

export default ConnectedRunTargetSelector;
