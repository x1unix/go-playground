import React, { FC, useMemo } from 'react';
import copy from 'copy-to-clipboard';
import { Target } from '@fluentui/react-hooks';
import { TeachingBubble, Link, getTheme, DirectionalHint, IButtonProps } from '@fluentui/react';

interface Props {
  visible?: boolean
  snippetId?: string
  originUrl?: string
  target?: Target
  onDismiss?: () => void
}

const SharePopup: FC<Props> = ({ visible, snippetId, originUrl, onDismiss, target }) => {
  const primaryButtonProps: IButtonProps = useMemo(
    () => ({
      children: 'Copy link',
      onClick: () => {
        copy(`${originUrl}/snippet/${snippetId}`);
        onDismiss?.();
        console.log('snippet:', snippetId);
      },
    }),
    [snippetId, originUrl, onDismiss],
  );

  if (!visible) {
    return <></>;
  }

  const { semanticColors: { bodyBackground } } = getTheme();
  return (
    <TeachingBubble
      calloutProps={{ directionalHint: DirectionalHint.bottomCenter }}
      isWide={true}
      hasCloseButton={true}
      headline="Share successfull"
      onDismiss={onDismiss}
      target={target}
      primaryButtonProps={primaryButtonProps}
    >
      <span>Your snippet is available at </span>
      <Link
        href={`${originUrl}/snippet/${snippetId}`}
        target="_blank"
        underline
        styles={{
          root: [
            {
              color: bodyBackground
            }
          ]
        }}
      >
        {`${originUrl}/snippet/${snippetId}`}
      </Link>
    </TeachingBubble>
  );
}

SharePopup.defaultProps = {
  originUrl: window?.location?.origin
}

export default SharePopup;
