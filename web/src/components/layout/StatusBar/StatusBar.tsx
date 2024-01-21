import React from "react";
import clsx from "clsx";
import {editor, MarkerSeverity} from "monaco-editor";
import {VscDebugAlt} from "react-icons/vsc";
import environment from "~/environment";
import {StateDispatch, connect} from "~/store";

import { EllipsisText } from "~/components/utils/EllipsisText";
import { StatusBarItem } from "~/components/layout/StatusBar/StatusBarItem";
import { VimStatusBarItem } from "~/plugins/vim/VimStatusBarItem";

import "./StatusBar.css";


interface OwnProps {}

interface StateProps {
  loading?: boolean
  running?: boolean
  lastError?: string|null
  markers?: editor.IMarkerData[]
}

interface Props extends OwnProps, StateProps {
  dispatch: StateDispatch
}

const pluralize = (count: number, label: string) => (
  count === 1 ? (
    `${count} ${label}`
  ): (
    `${count} ${label}s`
  )
)

const getMarkerCounters = (markers?: editor.IMarkerData[]) => {
  let errors = 0;
  let warnings = 0;
  if (!markers?.length) {
    return {errors, warnings};
  }

  for (let marker of markers) {
    switch (marker.severity) {
      case MarkerSeverity.Warning:
        warnings++;
        break;
      case MarkerSeverity.Error:
        errors++;
        break;
      default:
        break;
    }
  }

  return {errors, warnings};
};

const getStatusItem = ({loading, running, lastError}: StateProps) => {
  if (loading) {
    return (
      <StatusBarItem icon="Build">
        <EllipsisText>
          Loading
        </EllipsisText>
      </StatusBarItem>
    );
  }

  if (running) {
    return (
      <StatusBarItem icon={VscDebugAlt}>
        <EllipsisText>
          Running program
        </EllipsisText>
      </StatusBarItem>
    )
  }

  if (lastError) {
    return (
      <StatusBarItem
        icon="NotExecuted"
        hideTextOnMobile
        disabled
      >
      Build failed
      </StatusBarItem>
    )
  }
  return null;
}


const StatusBarBase: React.FC<Props> = ({
  loading,
  running,
  lastError,
  markers
}) => {
  const {
    warnings,
    errors
  } = getMarkerCounters(markers);
  return (
    <>
      <div
        className={clsx('StatusBar', {
          'StatusBar--busy': loading || running,
        })}
      >
        <div className="StatusBar__side-left">
          <StatusBarItem
            icon="ErrorBadge"
            button
          >
            {pluralize(errors, 'Error')}
          </StatusBarItem>
          { warnings > 0 ? (
            <StatusBarItem
              icon="Warning"
              button
            >
              {pluralize(warnings, 'Warning')}
            </StatusBarItem>
          ) : null }
          <VimStatusBarItem />
          {
            getStatusItem({
              loading,
              running,
              lastError
            })
          }
        </div>
        <div className="StatusBar__side-right">
          <StatusBarItem
            icon="Feedback"
            title="Send feedback"
            href={environment.urls.issue}
            iconOnly
          />
          <StatusBarItem
            imageSrc="/github-mark-light-32px.png"
            title="GitHub"
            href={environment.urls.github}
            iconOnly
          />
        </div>
      </div>
    </>
  );
};

export const StatusBar = connect<StateProps, OwnProps>(
  ({status}) => {
    const {
      loading,
      lastError,
      running ,
      markers
    } = status!;
    return { loading, lastError, running, markers };
  }
)(StatusBarBase);
