import React, {useState} from 'react'
import { Stack, type IStackStyles } from '@fluentui/react';

const headerStyles: IStackStyles = {
  root: {
    flex: 1,
  }
};

const tabStyles: IStackStyles = {
  root: {
    flex: 1,
    display: 'flex',
    alignItems: 'stretch',
    flexDirection: 'column',
  }
};

const cmdStyles: IStackStyles = {
  root: {
    display: 'flex',
    alignItems: 'stretch',
    flexDirection: 'column',
  }
};

interface Props {}

export const TabHeader: React.FC<Props> = () => {
  const [tabCount, setTabCount] = useState(1);
  return (
    <Stack
      grow
      horizontal
      verticalFill
      horizontalAlign='stretch'
      verticalAlign='stretch'
      styles={headerStyles}
    >
      {
        Array.from({length: tabCount}, (_, i) => i).map(i => (
          <Stack.Item styles={tabStyles}>
            <div style={{background: i % 2 === 0 ? '#f08' : '#faf', flex: 1}}>Node {i}</div>
          </Stack.Item>
        ))
      }
      <Stack.Item styles={cmdStyles}>
        <div style={{background: '#04f', flex: 1}} onClick={() => setTabCount(tabCount + 1)}>UP</div>
      </Stack.Item>
      <Stack.Item styles={cmdStyles}>
        <div style={{background: '#0cf', flex: 1}}>DL</div>
      </Stack.Item>
    </Stack>
  )
}
