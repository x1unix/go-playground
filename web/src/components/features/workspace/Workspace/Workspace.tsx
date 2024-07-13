import React, { useState, useMemo, useRef } from 'react'
import { useTheme } from '@fluentui/react'
import { type StateDispatch, connect } from '~/store'
import {
  type WorkspaceState,
  dispatchCreateFile,
  dispatchRemoveFile,
  dispatchImportFile,
  newFileSelectAction,
} from '~/store/workspace'

import { TabView } from '~/components/elements/tabs/TabView'
import type { TabBarAction, TabIconStyles } from '~/components/elements/tabs/types'

import { ConnectedCodeEditor } from '../CodeEditor'
import { FlexContainer } from '../FlexContainer'
import { NewFileModal } from '../NewFileModal'
import { ContentPlaceholder } from '../ContentPlaceholder'
import { newEmptyFileContent } from './utils'
import { useConfirmModal } from '~/components/modals/ConfirmModal'

interface Props extends WorkspaceState {
  dispatch: StateDispatch
}

const Workspace: React.FC<Props> = ({ dispatch, files, selectedFile, snippet }) => {
  const { palette, semanticColors } = useTheme()
  const uploadRef = useRef<HTMLInputElement>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const { showConfirm } = useConfirmModal()

  const tabIconStyles: TabIconStyles = {
    active: {
      icon: 'FileCode',
      color: palette.themePrimary,
    },
    inactive: {
      icon: 'FileCode',
      color: semanticColors.disabledText,
    },
  }

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
    void showConfirm({
      title: `Delete file "${key}"?`,
      message: "This item will be deleted permanently. You can't undo this action.",
      confirmText: 'Delete',
    }).then((result) => {
      if (result) {
        dispatch(dispatchRemoveFile(key))
      }
    })
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
      allowEmpty
      responsive
      actions={actions}
      tabs={tabs}
      icon={tabIconStyles}
      selectedTab={selectedFile}
      onClosed={onTabClose}
      onSelected={onTabChange}
      placeholder="No files"
      disabled={(snippet?.loading ?? false) || !!snippet?.error}
    >
      {tabs?.length ? (
        <FlexContainer>
          <ConnectedCodeEditor />
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
