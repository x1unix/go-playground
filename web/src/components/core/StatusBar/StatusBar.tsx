import React from 'react';
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
        <StatusBarItem iconName="ErrorBadge" button>
          0 Errors
        </StatusBarItem>
        <StatusBarItem iconName="NotExecuted" disabled>
          Build failed
        </StatusBarItem>
        <StatusBarItem iconName="Build">
          <EllipsisText>
            Building program
          </EllipsisText>
        </StatusBarItem>
      </div>
      <div className="StatusBar__side-right">
        {/*<PrimaryButton iconProps={{iconName: 'AddFriend'}}>*/}
        {/*  0 Errors*/}
        {/*</PrimaryButton>*/}
      </div>
    </div>
  );
};

export default StatusBar;
