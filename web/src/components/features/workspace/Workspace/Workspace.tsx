import React, { useState, useMemo, useRef } from 'react'
import { type StateDispatch, connect } from '~/store'
import {
  type WorkspaceState,
  dispatchCreateFile,
  dispatchRemoveFile,
  dispatchImportFile,
  newFileSelectAction,
} from '~/store/workspace'

import { TabView } from '~/components/elements/tabs/TabView'
import type { TabBarAction } from '~/components/elements/tabs/types'

import { CodeEditor } from '../CodeEditor'
import { FlexContainer } from '../FlexContainer'
import { NewFileModal } from '../NewFileModal'
import { ContentPlaceholder } from '../ContentPlaceholder'
import { newEmptyFileContent } from './utils'

interface Props extends WorkspaceState {
  dispatch: StateDispatch
}

const Workspace: React.FC<Props> = ({ dispatch, files, selectedFile, snippet }) => {
  const uploadRef = useRef<HTMLInputElement>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const tabs = useMemo(
    () =>
      files
        ? Object.keys(files).map((key) => ({
            key,
            label: key,
          }))
        : null,
    [files],
  )

  const onTabClose = (key: string) => {
    dispatch(dispatchRemoveFile(key))
  }

  const onTabChange = (key: string) => {
    dispatch(newFileSelectAction(key))
  }

  const actions: TabBarAction[] = useMemo(
    () => [
      {
        label: 'New file',
        icon: { iconName: 'Add' },
        onClick: () => {
          setModalOpen(true)
        },
      },
      {
        label: 'Upload',
        icon: { iconName: 'Upload' },
        onClick: () => uploadRef.current?.click(),
      },
    ],
    [setModalOpen],
  )

  const onModalClose = (fileName?: string) => {
    setModalOpen(false)
    if (!fileName) {
      return
    }

    dispatch(dispatchCreateFile(fileName, newEmptyFileContent(fileName)))
  }

  const onFilePick = ({ target: { files } }: React.ChangeEvent<HTMLInputElement>) => {
    if (!files?.length) {
      return
    }

    dispatch(dispatchImportFile(files))
  }

  return (
    <TabView
      allowEmpty={true}
      actions={actions}
      tabs={tabs}
      selectedTab={selectedFile}
      onClosed={onTabClose}
      onSelected={onTabChange}
      disabled={snippet?.loading || !!snippet?.error}
    >
      {tabs?.length ? (
        <FlexContainer>
          <CodeEditor />
        </FlexContainer>
      ) : (
        <ContentPlaceholder
          isLoading={snippet?.loading}
          error={snippet?.error}
          onNewFileClick={() => {
            setModalOpen(true)
          }}
          onUploadClick={() => uploadRef.current?.click()}
        />
      )}
      <NewFileModal
        isOpen={modalOpen}
        onClose={onModalClose}
        fileNameValidator={(fileName) => {
          if (files?.[fileName]) {
            return 'File already exists'
          }
          return undefined
        }}
      />
      <input
        ref={uploadRef}
        type="file"
        hidden
        multiple
        accept=".go"
        style={{ display: 'none' }}
        onChange={onFilePick}
      />
    </TabView>
  )
}

export const ConnectedWorkspace = connect<WorkspaceState, {}>(({ workspace }) => ({ ...workspace }))(Workspace)
