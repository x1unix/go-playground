import React, { useState, useCallback } from 'react';
import { getTheme } from '@fluentui/react';
import { Resizable } from 're-resizable';
import Preview from './Preview';

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
  const { palette: { accent }, semanticColors: { buttonBorder } } = getTheme();
  const [height, setHeight] = useState(DEFAULT_HEIGHT_PX);
  const onResize = useCallback((e, direction, ref, d) => {
    setHeight(height + d.height);
  }, [setHeight, height]);

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
      <Preview />
    </Resizable>
  );
};

export default ResizablePreview;
