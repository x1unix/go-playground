import React, { useEffect, useState } from 'react'
import { Stack, TextField, DefaultButton, PrimaryButton, DefaultSpacing, type IStackTokens } from '@fluentui/react'

import { Dialog } from '~/components/elements/modals/Dialog'
import { DialogActions } from '~/components/elements/modals/DialogActions'

interface Props {
  isOpen: boolean,
  workspaceName: string | undefined,
  nameValidator?: (name: string) => string | undefined,
  onClose: (name?: string) => void
}

const verticalStackTokens: IStackTokens = {
  childrenGap: DefaultSpacing.s1,
}

const validateName = (value?: string, validatorFn?: Props['nameValidator']): string | undefined => {
  value = value?.trim();

  if (!value?.length) {
    return 'Workspace name is required'
  }

  return validatorFn?.(value)
}

const modalStyles = {
  main: {
    maxWidth: 480,
  },
}

export const SaveWorkspaceModal: React.FC<Props> = ({ isOpen, onClose, nameValidator, workspaceName }) => {
  const [name, setName] = useState(workspaceName)
  const [isDirty, setIsDirty] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)

  const isValid = !errorMessage?.length

  useEffect(() => {
    if (isOpen) {
      return
    }
    setIsDirty(false)
    setErrorMessage('Empty workspace name')
  }, [isOpen])

  useEffect(() => {
    const errMsg = validateName(name, nameValidator)
    setErrorMessage(errMsg)
  }, [name, nameValidator])

  return (
    <Dialog
      label="Save Workspace"
      isOpen={isOpen}
      styles={modalStyles}
      onDismiss={() => {
        onClose()
      }}
    >
      <Stack tokens={verticalStackTokens}>
        <Stack.Item>
          <span>Enter workspace name:</span>
        </Stack.Item>
        <Stack.Item>
          <TextField
            autoFocus
            minLength={1}
            defaultValue={name}
            placeholder="Workspace Name"
            onChange={(_, value) => {
              setName(value)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && isValid) {
                onClose(name)
              } else {
                setIsDirty(true)
              }
            }}
            onGetErrorMessage={(value) => {
              if (!isDirty) {
                return undefined
              }

              setIsDirty(true)
              return errorMessage
            }}
          />
        </Stack.Item>
        <Stack.Item>
          <DialogActions>
            <DefaultButton
              text="Cancel"
              onClick={() => {
                onClose()
              }}
            />
            <PrimaryButton
              text="OK"
              onClick={() => {
                onClose(name)
              }}
              disabled={!isValid}
            />
          </DialogActions>
        </Stack.Item>
      </Stack>
    </Dialog>
  )
}
