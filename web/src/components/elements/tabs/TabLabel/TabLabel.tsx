import React from 'react';
import { Stack, type IStackStyles } from '@fluentui/react';

const containerStyles: IStackStyles = {
  root: {
    flex: 1,
  }
};

const labelCellStyles: IStackStyles = {
  root: {
    flex: 1,
    background: '#888',
  }
};

const closeCellStyles: IStackStyles = {
  root: {
    background: '#f33',
  }
};

interface Props {
  label: string
  active?: boolean
  onClick?: () => void
  onClose?: () => void
}

export const TabLabel: React.FC<Props> = ({label}) => {
  return (
    <Stack
      grow
      horizontal
      verticalFill
      horizontalAlign='stretch'
      verticalAlign='center'
      styles={containerStyles}
    >
      <Stack.Item
        styles={labelCellStyles}
      >
        {label}
      </Stack.Item>
      <Stack.Item
        styles={closeCellStyles}
      >
        &times;
      </Stack.Item>
    </Stack>
  );
};
