import React from 'react';
import config from '~/services/config';
import EllipsisText from '~/components/utils/EllipsisText';
import StatusBarItem from '~/components/core/StatusBar/StatusBarItem';
import './StatusBar.css';

interface Props {
  busy?: boolean
}

const StatusBar: React.FC<Props> = () => {
  return (
    <div className="StatusBar StatusBar--busy">
      <div className="StatusBar__side-left">
        <StatusBarItem
          iconName="ErrorBadge"
          title="No Problems"
          button
        >
          0 Errors
        </StatusBarItem>
        {/*<StatusBarItem*/}
        {/*  iconName="NotExecuted"*/}
        {/*  hideTextOnMobile*/}
        {/*  disabled*/}
        {/*>*/}
        {/*  Build failed*/}
        {/*</StatusBarItem>*/}
        <StatusBarItem iconName="Build">
          <EllipsisText>
            Building program
          </EllipsisText>
        </StatusBarItem>
      </div>
      <div className="StatusBar__side-right">
        <StatusBarItem
          iconName="Code"
          title="Select runtime"
          hideTextOnMobile
          button
        >
          WebAssembly
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
  );
};

export default StatusBar;
