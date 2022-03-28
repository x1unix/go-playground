import React from 'react';
import { CompoundButton } from '@fluentui/react/lib/Button';
import { Modal } from '@fluentui/react/lib/Modal';
import {
  Stack, IStackTokens, getTheme, IconButton, mergeStyleSets
} from '@fluentui/react';
import { getContentStyles, getIconButtonStyles } from '~/styles/modal';
import {RuntimeType} from "~/services/config";

const options = [
  {
    label: 'Go Playground',
    description: 'Build and run code on official Go playground server.',
    type: RuntimeType.GoPlayground,
  },
  {
    label: 'Go Playground (GoTip)',
    description: 'Run on server with a current unstable development build of Go.',
    type: RuntimeType.GoTipPlayground,
  },
  {
    label: 'WebAssembly',
    description: 'Run Go code in your web browser with access to JS API.',
    type: RuntimeType.WebAssembly,
  }
]

const buttonStyles = mergeStyleSets({
  button: {
    maxWidth: 'initial'
  }
});

interface Props {
  isOpen?: boolean
  value: RuntimeType
  onClose?: (v?: RuntimeType) => void
}

const EnvironmentSelectModal: React.FC<Props> = ({
  isOpen, onClose, value
}) => {
  const theme = getTheme();
  const contentStyles = getContentStyles(theme);
  const iconButtonStyles = getIconButtonStyles(theme);
  const stackTokens: IStackTokens = { childrenGap: 10 };

  return (
    <Modal
      isOpen={isOpen}
      onDismiss={() => onClose?.()}
      topOffsetFixed={true}
      containerClassName={contentStyles.container}
    >
      <div className={contentStyles.header}>
        <span>Select Environment</span>
        <IconButton
          iconProps={{ iconName: 'Cancel' }}
          styles={iconButtonStyles}
          ariaLabel='Close popup modal'
          onClick={() => onClose?.()}
        />
      </div>
      <div className={contentStyles.body}>
        <Stack tokens={stackTokens}>
          {
            options.map(({label, description, type}) => (
              <CompoundButton
                key={type}
                secondaryText={description}
                checked={type === value}
                className={buttonStyles.button}
                onClick={() => onClose?.(type)}
              >
                {label}
              </CompoundButton>
            ))
          }
        </Stack>
      </div>
    </Modal>
  );
}

export default EnvironmentSelectModal;
