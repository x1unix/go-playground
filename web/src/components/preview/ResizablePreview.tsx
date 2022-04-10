import React, { useState, useCallback } from 'react';
import { VscSplitHorizontal, VscSplitVertical } from 'react-icons/vsc';
import { getTheme } from '@fluentui/react';
import { Resizable } from 're-resizable';

import Preview from './Preview';
import PanelHeader from "@components/core/Panel/PanelHeader";
import './ResizablePreview.css';

const DEFAULT_HEIGHT_PX = 300;
const DEFAULT_WIDTH = '100%';
const handleClasses = {
  top: 'ResizablePreview__handle--top'
}

// re-resizable requires to implicitly mark disabled corners
const enabledCorners = {
  top: true,
  right: false,
  bottom: false,
  left: false,
  topRight: false,
  bottomRight: false,
  bottomLeft: false,
  topLeft: false
}

interface Props { }

const ResizablePreview: React.FC<Props> = () => {
  const {palette: { accent }, semanticColors: { buttonBorder }} = getTheme();
  const [height, setHeight] = useState(DEFAULT_HEIGHT_PX);
  const onResize = useCallback((e, direction, ref, d) => {
    setHeight(prevValue => prevValue + d.height);
  }, [setHeight]);

  return (
    <Resizable
      className='ResizablePreview'
      handleClasses={handleClasses}
      size={{ height, width: DEFAULT_WIDTH }}
      enable={enabledCorners}
      onResizeStop={onResize}
      style={{
        '--pg-handle-active-color': accent,
        '--pg-handle-default-color': buttonBorder,
      } as any}
    >
      <PanelHeader
        label="Output"
        commands={{
          'split-horizontally': {
            hidden: true,
            icon: <VscSplitVertical />,
            label: 'Use horizontal layout'
          },
          'split-vertically': {
            hidden: false,
            icon: <VscSplitHorizontal />,
            label: 'Use vertical layout'
          }
        }}
      />
      <Preview />
    </Resizable>
  );
};

export default ResizablePreview;
