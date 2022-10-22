import React, {useState} from 'react';
import {connect} from 'react-redux';
import {editor, MarkerSeverity} from 'monaco-editor';
import { newEnvironmentChangeDispatcher } from '~/store';
import config, {RuntimeType} from '~/services/config';
import EllipsisText from '~/components/utils/EllipsisText';
import StatusBarItem from '~/components/core/StatusBar/StatusBarItem';
import EnvironmentSelectModal from '~/components/modals/EnvironmentSelectModal';
import VimStatusBarItem from '~/plugins/vim/VimStatusBarItem';
import './StatusBar.css';

interface Props {
  loading?: true
  lastError?: string
  runtime?: RuntimeType
  markers?: editor.IMarkerData[]
  dispatch?: Function
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

const getStatusItem = ({loading, lastError}) => {
  if (loading) {
    return (
      <StatusBarItem icon="Build">
        <EllipsisText>
          Loading
        </EllipsisText>
      </StatusBarItem>
    );
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

const StatusBar: React.FC<Props> = ({
  loading, lastError, runtime, markers, dispatch
}) => {
  const [ runSelectorModalVisible, setRunSelectorModalVisible ] = useState(false);
  const className = loading ? 'StatusBar StatusBar--busy' : 'StatusBar';
  const {warnings, errors} = getMarkerCounters(markers);
  return (
    <>
      <div className={className}>
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
          {getStatusItem({loading, lastError})}
        </div>
        <div className="StatusBar__side-right">
          <StatusBarItem
            icon="Code"
            title="Select environment"
            disabled={loading}
            onClick={() => setRunSelectorModalVisible(true)}
            hideTextOnMobile
            button
          >
            Environment: {RuntimeType.toString(runtime)}
          </StatusBarItem>
          <StatusBarItem
            icon="Feedback"
            title="Send feedback"
            href={config.issueUrl}
            iconOnly
          />
          <StatusBarItem
            imageSrc="/github-mark-light-32px.png"
            title="GitHub"
            href={config.githubUrl}
            iconOnly
          />
        </div>
      </div>
      <EnvironmentSelectModal
        value={runtime as RuntimeType}
        isOpen={runSelectorModalVisible}
        onClose={val => {
          setRunSelectorModalVisible(false);
          if (val) {
            dispatch?.(newEnvironmentChangeDispatcher(val));
          }
        }}
      />
    </>
  );
};

export default connect(({status: {loading, lastError, markers}, settings: {runtime}}: any) => (
  {loading, lastError, markers, runtime}
))(StatusBar);
