import React from 'react';
import {connect} from 'react-redux';
import {editor, MarkerSeverity} from 'monaco-editor';
import EllipsisText from '~/components/utils/EllipsisText';
import StatusBarItem from '~/components/core/StatusBar/StatusBarItem';
import VimStatusBarItem from '~/plugins/vim/VimStatusBarItem';
import './StatusBar.css';
import environment from "~/environment";

interface Props {
  loading?: true
  lastError?: string
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
  loading, lastError, markers
}) => {
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

export default connect(({status: {loading, lastError, markers}}: any) => (
  {loading, lastError, markers}
))(StatusBar);
