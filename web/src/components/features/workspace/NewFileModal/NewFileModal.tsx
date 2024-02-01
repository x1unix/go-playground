import React, { useEffect, useState } from 'react'
import { Stack, TextField, DefaultButton, PrimaryButton, DefaultSpacing, type IStackTokens } from '@fluentui/react'

import { Dialog } from '~/components/elements/modals/Dialog'
import { DialogActions } from '~/components/elements/modals/DialogActions'

interface Props {
  isOpen: boolean
  fileNameValidator?: (fileName: string) => string | undefined
  onClose: (fileName?: string) => void
}

const fileNameRegex = /^(?!.*(\.\.|\/\.|\.\/|\/$))[a-zA-Z0-9_-]+(\/[a-zA-Z0-9_-]+)*\.go$/i
const maxFileNameLength = 255

const verticalStackTokens: IStackTokens = {
  childrenGap: DefaultSpacing.s1,
}

const validateFileName = (value?: string, validatorFn?: Props['fileNameValidator']): string | undefined => {
  if (!value?.length) {
    return 'File name is required'
  }
  if (value.length >= maxFileNameLength) {
    return 'File name is too long'
  }

  if (!fileNameRegex.test(value)) {
    return 'Invalid file name'
  }

  return validatorFn?.(value)
}

const modalStyles = {
  main: {
    maxWidth: 480,
  },
}

export const NewFileModal: React.FC<Props> = ({ isOpen, onClose, fileNameValidator }) => {
  const [fileName, setFileName] = useState<string | undefined>()
  const [isDirty, setIsDirty] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)

  const isValid = !errorMessage?.length

  useEffect(() => {
    if (isOpen) {
      return
    }

    setFileName('')
    setIsDirty(false)
    setErrorMessage('Empty file name')
  }, [isOpen])

  useEffect(() => {
    const errMsg = validateFileName(fileName, fileNameValidator)
    setErrorMessage(errMsg)
  }, [fileName, fileNameValidator])

  return (
    <Dialog
      label="New file"
      isOpen={isOpen}
      styles={modalStyles}
      onDismiss={() => {
        onClose()
      }}
    >
      <Stack tokens={verticalStackTokens}>
        <Stack.Item>
          <span>Enter new file name:</span>
        </Stack.Item>
        <Stack.Item>
          <TextField
            autoFocus
            minLength={4}
            maxLength={maxFileNameLength}
            defaultValue={fileName}
            placeholder="Example: main.go"
            onChange={(_, value) => {
              setFileName(value)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && isValid) {
                onClose(fileName)
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
                onClose(fileName)
              }}
              disabled={!isValid}
            />
          </DialogActions>
        </Stack.Item>
      </Stack>
    </Dialog>
  )
}
