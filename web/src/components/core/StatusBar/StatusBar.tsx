import React from 'react';
import EllipsisText from '~/components/utils/EllipsisText';
import StatusBarButton from '~/components/core/StatusBar/StatusBarButton';
import './StatusBar.css';

interface Props {
  busy?: boolean
}

const StatusBar: React.FC<Props> = () => {
  return (
    <div className="StatusBar StatusBar--busy">
      <div className="StatusBar__side-left">
        <StatusBarButton iconName="ErrorBadge">
          0 Errors
        </StatusBarButton>
        <StatusBarButton iconName="NotExecuted">
          Build failed
        </StatusBarButton>
        <StatusBarButton iconName="Build">
          <EllipsisText>
            Building program
          </EllipsisText>
        </StatusBarButton>
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
