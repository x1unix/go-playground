import React, { type FC } from 'react'
import copy from 'copy-to-clipboard'
import { type Target } from '@fluentui/react-hooks'
import { TeachingBubble, Link, DirectionalHint, useTheme } from '@fluentui/react'

interface Props {
  visible?: boolean
  snippetId?: string | null
  originUrl?: string
  target?: Target
  onDismiss?: () => void
}

export const SharePopup: FC<Props> = ({ visible, snippetId, originUrl, onDismiss, target }) => {
  const {
    semanticColors: { bodyBackground },
  } = useTheme()

  if (!visible) {
    return <></>
  }

  return (
    <TeachingBubble
      calloutProps={{
        directionalHint: DirectionalHint.bottomCenter,
        // Monaco steals focus and cause scroll event, which cause immediate bubble close.
        preventDismissOnLostFocus: true,
        preventDismissOnScroll: true,
      }}
      isWide={true}
      hasCloseButton={true}
      headline="Share successful"
      onDismiss={onDismiss}
      target={target}
      primaryButtonProps={{
        children: 'Copy link',
        onClick: (e) => {
          copy(`${originUrl}/snippet/${snippetId}`)
          onDismiss?.()
        },
      }}
    >
      <span>Your snippet is available at </span>
      <Link
        href={`${originUrl}/snippet/${snippetId}`}
        target="_blank"
        underline
        styles={{
          root: [
            {
              // HACK: for some reason in recent @fluentui/react link color is flickering.
              color: `${bodyBackground} !important`,
            },
          ],
        }}
        onClick={(e) => {
          e.stopPropagation()
        }}
      >
        {`${originUrl}/snippet/${snippetId}`}
      </Link>
    </TeachingBubble>
  )
}

SharePopup.defaultProps = {
  originUrl: window?.location?.origin,
}
