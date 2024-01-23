import React, {useMemo} from 'react';
import {
  useTheme,
  Stack,
  IconButton,
} from '@fluentui/react';

import { getActionBtnStyle, commandCellStyles } from './styles';
import { TabBarAction } from '../types';

interface Props {
  disabled?: boolean
  actions?: TabBarAction[]
}

export const TabActionBar: React.FC<Props> = ({actions, disabled}) => {
  const theme = useTheme();
  const actionBtnStyles= useMemo(() => getActionBtnStyle(theme), [theme]);

  return (
    <Stack
      grow
      horizontal
      verticalFill
      horizontalAlign='stretch'
      verticalAlign='stretch'
      styles={{
        root: {
          flex: 1,
        }
      }}
    >
      {
        actions?.map(({label, icon, onClick}) => (
          <Stack.Item styles={commandCellStyles}>
            <IconButton
              title={label}
              ariaLabel={label}
              disabled={disabled}
              iconProps={icon}
              styles={actionBtnStyles}
              onClick={onClick}
              data-is-focusable
            />
          </Stack.Item>
        ))
      }
    </Stack>
  )
}
