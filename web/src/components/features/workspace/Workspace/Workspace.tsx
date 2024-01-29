import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';

import { TabView } from '~/components/elements/tabs/TabView';
import type {TabBarAction, TabInfo} from '~/components/elements/tabs/types';

import { CodeEditor } from '../CodeEditor';
import { FlexContainer } from '../FlexContainer';
import { NewFileModal } from '../NewFileModal';
import { ContentPlaceholder } from '../ContentPlaceholder';

import { skipIndex } from './utils';


interface Props {}

export const Workspace: React.FC<Props> = () => {
  const uploadRef = useRef<HTMLInputElement>(null);
  const [ modalOpen, setModalOpen ] = useState(false);
  const [selectedTab, setSelectedTab] = useState<string>();
  const [tabs, setTabs] = useState<TabInfo[]>([]);

  const fileNames = useMemo(() => new Set(tabs.map(t => t.label)), [tabs]);

  const onTabClose = (key: string, i: number) => {
    if (key === selectedTab) {
      const nextId = i === 0 ? 1 : i - 1;
      const nextKey = tabs[nextId]?.key;
      setSelectedTab(nextKey);
    }
    setTabs((prev) => skipIndex(prev, i));
  };

  const actions: TabBarAction[] = useMemo(() => [
    {
      label: 'New file',
      icon: { iconName: 'Add' },
      onClick: () => {
        setModalOpen(true);
      }
    },
    {
      label: 'Upload',
      icon: { iconName: 'Upload' },
      onClick: () => uploadRef.current?.click(),
    }
  ], [setModalOpen]);

  const onModalClose = (fileName?: string) => {
    setModalOpen(false);
    if (!fileName) {
      return;
    }
    setTabs((prev) => ([
      ...prev,
      {
        key: fileName,
        label: fileName,
      }
    ]));
    setSelectedTab(fileName);
  };

  return (
    <TabView
      allowEmpty={true}
      actions={actions}
      tabs={tabs}
      selectedTab={selectedTab}
      onClosed={onTabClose}
      onSelected={setSelectedTab}
    >
      { !!tabs.length ? (
        <FlexContainer>
          <CodeEditor />
        </FlexContainer>
      ) : (
        <ContentPlaceholder
          onNewFileClick={() => setModalOpen(true)}
          onUploadClick={() => uploadRef.current?.click()}
        />
      )}
      <NewFileModal
        isOpen={modalOpen}
        onClose={onModalClose}
        fileNameValidator={fileName => {
          if (fileNames.has(fileName)) {
            return 'File already exists';
          }
          return undefined;
        }}
      />
      <input
        ref={uploadRef}
        type="file"
        hidden
        multiple
        accept=".go"
        style={{display: 'none'}}
      />
    </TabView>
  )
};