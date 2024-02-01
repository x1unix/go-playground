import React, { useMemo } from 'react'
import { useId } from '@fluentui/react-hooks'
import { Modal, IconButton, useTheme, type IModalProps } from '@fluentui/react'

import { getContentStyles, getIconButtonStyles } from './styles'

interface Props extends IModalProps {
  label: string
  disabled?: boolean
  canClose?: boolean
}

/**
 * Dialog implements simple modal window template.
 */
export const Dialog: React.FC<Props> = ({ label, disabled, canClose, children, ...modalProps }) => {
  const titleId = useId('DialogTitle')
  const subtitleId = useId('DialogSubtitle')

  const theme = useTheme()
  const contentStyles = useMemo(() => getContentStyles(theme), [theme])
  const iconButtonStyles = useMemo(() => getIconButtonStyles(theme), [theme])

  return (
    <Modal
      {...modalProps}
      titleAriaId={titleId}
      subtitleAriaId={subtitleId}
      containerClassName={contentStyles.container}
    >
      <div className={contentStyles.header}>
        <span id={titleId}>{label}</span>
        {canClose && (
          <IconButton
            label="Close dialog"
            iconProps={{ iconName: 'Cancel' }}
            styles={iconButtonStyles}
            disabled={disabled}
            onClick={() => modalProps.onDismiss?.()}
          />
        )}
      </div>
      <div id={subtitleId} className={contentStyles.body}>
        {children}
      </div>
    </Modal>
  )
}

Dialog.defaultProps = {
  canClose: true,
}
