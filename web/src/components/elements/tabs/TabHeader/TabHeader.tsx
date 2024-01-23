import React, {useMemo} from 'react'
import {
  useTheme,
  Stack,
  FocusZone,
  type IStackStyles,
} from '@fluentui/react';

import { TabLabel } from '../TabLabel';
import { TabActionBar } from '../TabActionBar';
import type { TabBarAction, TabInfo, TabKey } from '../types';

interface Props {
  disabled?: boolean
  tabs?: TabInfo[]
  actions?: TabBarAction[]
  selectedTab?: TabKey
  allowEmpty?: boolean
  onSelected?: (key: TabKey, i: number) => void,
  onClosed?: (key: TabKey, i: number) => void,
}

const tabContainerStyles: IStackStyles = {
  root: {
    flex: 1,
  }
};

export const TabHeader: React.FC<Props> = ({tabs, actions, allowEmpty, selectedTab, onSelected, onClosed, disabled}) => {
  const { semanticColors } = useTheme();
  const headerStyles = useMemo(() => {
    return {
      root: {
        flex: '1 0',
        flexShrink: 0,
        background: semanticColors.bodyStandoutBackground,
      },
      inner: {
        justifyContent: 'flex-end',
      }
    };
  }, [semanticColors]);

  const cmdToolbarStyles: IStackStyles = {
    root: {
      // flex: 1,
      display: 'flex',
    }
  };

  return (
    <FocusZone
      style={{flex: 1}}
    >
      <Stack
        grow
        wrap
        horizontal
        verticalFill
        horizontalAlign='stretch'
        verticalAlign='stretch'
        styles={headerStyles}
      >
        {
          tabs?.map(({ key, label}, i) => (
            <Stack.Item key={key} styles={tabContainerStyles}>
              <TabLabel
                label={label}
                active={key === selectedTab}
                canClose={allowEmpty || (!!tabs?.length)}
                disabled={disabled}
                onClick={() => key !== selectedTab && onSelected?.(key, i)}
                onClose={() => onClosed?.(key, i)}
              />
            </Stack.Item>
          ))
        }
        <Stack.Item styles={cmdToolbarStyles}>
          <TabActionBar actions={actions} disabled={disabled}/>
        </Stack.Item>
      </Stack>
    </FocusZone>
  )
}
