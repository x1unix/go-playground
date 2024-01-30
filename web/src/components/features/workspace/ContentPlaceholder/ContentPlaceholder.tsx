import React from 'react';
import {useTheme, Spinner, PrimaryButton, DefaultButton} from '@fluentui/react';
import { Poster } from '~/components/elements/misc/Poster';

interface Props {
  isLoading?: boolean
  error?: string | null
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
            key='spinner'
            label='Loading editor...'
            labelPosition='right'
          />
        ) : error?.length ? (
          <Poster
            key='error-poster'
            label="Failed to load snippet"
            type="error"
            icon="PageRemove"
            message={error}
          />
        ) : (
          <Poster
            key='empty-poster'
            label="No open tabs"
            icon="List"
            message="Use buttons below to add files to a project."
          >
            <PrimaryButton
              key='new-file'
              text="Create new file"
              onClick={onNewFileClick}
            />
            <DefaultButton
              key='upload-file'
              text="Upload file"
              onClick={onUploadClick}
            />
          </Poster>
        ) }
      </div>
    </div>
  );
};
