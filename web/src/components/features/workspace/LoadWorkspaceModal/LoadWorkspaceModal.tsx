import {
  DefaultButton,
  DefaultSpacing,
  getScreenSelector,
  IconButton,
  IStackItemProps,
  mergeStyles,
  Stack,
  useTheme,
} from '@fluentui/react'
import React, { useEffect } from 'react'
import { Dialog } from '~/components/elements/modals/Dialog'
import { db } from '~/store/db'

interface Props {
  isOpen?: boolean
  onDismiss?: () => void
  onSelect?: (workspace: string) => void
}

export const LoadWorkspaceModal: React.FC<Props> = ({ isOpen, onDismiss, onSelect }) => {
  const { semanticColors } = useTheme()

  const modalStyles = {
    main: {
      maxWidth: 840,
    },
  }

  const [names, setNames] = React.useState<string[]>([])

  useEffect(() => {
    setNames([])

    if (isOpen) {
      db.getAllWorkspaces().then((workspaces) => {
        if (workspaces) {
          setNames(workspaces.map((workspace) => workspace.name as string))
        }
      })
    }
  }, [isOpen])

  return (
    <Dialog label="Workspaces" styles={modalStyles} isOpen={isOpen} onDismiss={onDismiss}>
      <Stack styles={{ root: { margin: `0 -${DefaultSpacing.s1}` } }}>
        {names.map((name) => (
          <Stack.Item
            key={name}
            styles={{
              root: mergeStyles({
                display: 'flex',
                boxSizing: 'border-box',
                marginBottom: DefaultSpacing.s1,
              }) as IStackItemProps['styles'],
            }}
          >
            <Stack
              horizontal
              tokens={{ childrenGap: DefaultSpacing.s1 }}
              horizontalAlign="space-between"
              style={{ width: '100%' }}
            >
              <Stack.Item grow>
                <DefaultButton
                  text={name}
                  onClick={() => onSelect?.(name)}
                  styles={{
                    root: { width: '100%' },
                    textContainer: { textTransform: 'capitalize', textAlign: 'left' },
                  }}
                />
              </Stack.Item>
              <Stack.Item>
                <IconButton iconProps={{ iconName: 'Delete' }} onClick={() => {}} />
              </Stack.Item>
            </Stack>
          </Stack.Item>
        ))}
      </Stack>
    </Dialog>
  )
}
