import React, { useState, useCallback } from 'react';
import { VscSplitHorizontal, VscSplitVertical } from 'react-icons/vsc';
import { getTheme } from '@fluentui/react';
import { Resizable } from 're-resizable';

import Preview from './Preview';
import PanelHeader from "@components/core/Panel/PanelHeader";
import './ResizablePreview.css';

const DEFAULT_HEIGHT_PX = 300;
const DEFAULT_WIDTH_PX = 400;
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

export enum PanelLayout {
  Horizontal = 'horizontal',
  Vertical = 'vertical'
}

interface Props {
  layout?: PanelLayout
}

const ResizablePreview: React.FC<Props> = ({layout = PanelLayout.Horizontal}) => {
  const {palette: { accent }, semanticColors: { buttonBorder }} = getTheme();
  const [height, setHeight] = useState(DEFAULT_HEIGHT_PX);
  const [width, setWidth] = useState(DEFAULT_WIDTH_PX);
  const onResize = useCallback((e, direction, ref, {height, width}) => {
    switch (layout) {
      case PanelLayout.Horizontal:
        setHeight(prevValue => prevValue + height);
        return;
      case PanelLayout.Vertical:
        setWidth(prevValue => prevValue + width);
        return;
      default:
        return;
    }
  }, [setHeight, setWidth]);

  const size = {
    height: layout === PanelLayout.Horizontal ? height : '100%',
    width: layout === PanelLayout.Vertical ? width : '100%'
  };

  const enabledCorners = {
    top: layout === PanelLayout.Horizontal,
    right: false,
    bottom: false,
    left: layout === PanelLayout.Vertical,
    topRight: false,
    bottomRight: false,
    bottomLeft: false,
    topLeft: false
  };

  return (
    <Resizable
      className='ResizablePreview'
      handleClasses={handleClasses}
      size={size}
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
