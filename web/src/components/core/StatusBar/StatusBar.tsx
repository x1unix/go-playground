import React, { useState } from 'react';
import { connect } from 'react-redux';
import {editor} from "monaco-editor";
import config, {RuntimeType} from '~/services/config';
import EllipsisText from '~/components/utils/EllipsisText';
import StatusBarItem from '~/components/core/StatusBar/StatusBarItem';
import EnvironmentSelectModal from '~/components/modals/EnvironmentSelectModal';
import {newEnvironmentChangeAction} from "~/store";
import './StatusBar.css';

interface Props {
  loading?: true
  lastError?: string
  runtime?: RuntimeType
  markers?: editor.IMarkerData[]
  dispatch?: Function
}

const getStatusItem = ({loading, lastError}) => {
  if (loading) {
    return (
      <StatusBarItem iconName="Build">
        <EllipsisText>
          Loading
        </EllipsisText>
      </StatusBarItem>
    );
  }

  if (lastError) {
    return (
      <StatusBarItem
        iconName="NotExecuted"
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
  return (
    <>
      <div className={className}>
        <div className="StatusBar__side-left">
          <StatusBarItem
            iconName="ErrorBadge"
            title="No Problems"
            button
          >
            {markers?.length ?? 0} Errors
          </StatusBarItem>
          {getStatusItem({loading, lastError})}
        </div>
        <div className="StatusBar__side-right">
          <StatusBarItem
            iconName="Code"
            title="Select environment"
            disabled={loading}
            onClick={() => setRunSelectorModalVisible(true)}
            hideTextOnMobile
            button
          >
            {RuntimeType.toString(runtime)}
          </StatusBarItem>
          <StatusBarItem
            iconName="Feedback"
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
            dispatch?.(newEnvironmentChangeAction(val));
          }
        }}
      />
    </>
  );
};

export default connect(({status: {loading, lastError, markers}, settings: {runtime}}: any) => (
  {loading, lastError, markers, runtime}
))(StatusBar);
