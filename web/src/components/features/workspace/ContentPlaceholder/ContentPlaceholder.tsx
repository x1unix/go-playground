import React from 'react';
import {useTheme, Spinner, PrimaryButton, DefaultButton} from '@fluentui/react';
import { Poster } from '~/components/elements/misc/Poster';

interface Props {
  isLoading?: boolean
  error?: string
  onNewFileClick?: () => void
  onUploadClick?: () => void
}

export const ContentPlaceholder: React.FC<Props> = ({isLoading, error, onUploadClick, onNewFileClick}) => {
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
        ) : error?.length ? (
          <Poster
            label="Failed to load snippet"
            type="error"
            icon="PageRemove"
            message={error}
          />
        ) : (
          <Poster
            label="No open tabs"
            icon="List"
            message="Use buttons below to add files to a project."
          >
            <PrimaryButton
              text="Create new file"
              onClick={onNewFileClick}
            />
            <DefaultButton
              text="Upload file"
              onClick={onUploadClick}
            />
          </Poster>
        ) }
      </div>
    </div>
  );
};
