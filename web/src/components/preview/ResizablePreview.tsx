import React, { useState, useCallback } from 'react';
import { Resizable } from 're-resizable';
import Preview from './Preview';

import './ResizablePreview.css';

const DEFAULT_HEIGHT_PX = 300;
const DEFAULT_WIDTH = '100%';

interface Props { }

const ResizablePreview: React.FC<Props> = () => {
  const [height, setHeight] = useState(DEFAULT_HEIGHT_PX);
  const onResize = useCallback((e, direction, ref, d) => {
    setHeight(height + d.height);
  }, [setHeight, height]);

  return (
    <Resizable
      className='ResizablePreview'
      size={{ height, width: DEFAULT_WIDTH }}
      onResizeStop={onResize}
    >
      <Preview />
    </Resizable>
  );
};

export default ResizablePreview;
