import React from 'react';
import { useTheme, Spinner } from '@fluentui/react';

interface Props {
  isLoading?: boolean
}

export const ContentPlaceholder: React.FC<Props> = ({isLoading}) => {
  const theme = useTheme();
  return (
    <div
      style={{
        flex: 1,
        background: theme.semanticColors.bodyStandoutBackground,
        alignItems: 'stretch',
        justifyContent: 'stretch'
      }}
    >
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
        }}
      >
        { isLoading ? (
          <Spinner
            label='Loading editor...'
            labelPosition='right'
          />
        ) : (
          <div
            style={{
              color: theme.semanticColors.disabledText,
            }}
          >
            No open tabs
          </div>
        ) }
      </div>
    </div>
  );
};
