import React, { useState, useCallback } from 'react';
import { getTheme } from '@fluentui/react';
import { Resizable } from 're-resizable';
import clsx from 'clsx';
import {
  VscSplitHorizontal, VscSplitVertical, VscChevronDown, VscChevronUp
} from 'react-icons/vsc';

import Preview from './Preview';
import PanelHeader from "@components/core/Panel/PanelHeader";
import './ResizablePreview.css';

const DEFAULT_HEIGHT_PX = 300;
const DEFAULT_WIDTH_PX = 400;
const MIN_HEIGHT = 36;
const handleClasses = {
  top: 'ResizablePreview__handle--top',
  left: 'ResizablePreview__handle--left',
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
  const [collapsed, setCollapsed] = useState(false);
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
  }, [setHeight, setWidth, layout]);

  const size = {
    height: layout === PanelLayout.Horizontal ? height : '100%',
    width: layout === PanelLayout.Vertical ? width : '100%'
  };

  const enabledCorners = {
    top: !collapsed && layout === PanelLayout.Horizontal,
    right: false,
    bottom: false,
    left: !collapsed && layout === PanelLayout.Vertical,
    topRight: false,
    bottomRight: false,
    bottomLeft: false,
    topLeft: false
  };

  return (
    <Resizable
      className={
        clsx(
          'ResizablePreview',
          collapsed && 'ResizablePreview--collapsed',
          `ResizablePreview--${layout}`
        )
      }
      handleClasses={handleClasses}
      size={size}
      enable={enabledCorners}
      onResizeStop={onResize}
      minHeight={MIN_HEIGHT}
      style={{
        '--pg-handle-active-color': accent,
        '--pg-handle-default-color': buttonBorder,
      } as any}
    >
      <PanelHeader
        label="Output"
        commands={{
          'collapse': {
            hidden: collapsed,
            icon: <VscChevronDown />,
            label: 'Collapse',
            onClick: () => {
              console.log('collapse!');
              setCollapsed(true);
            }
          },
          'expand': {
            hidden: !collapsed,
            icon: <VscChevronUp />,
            label: 'Expand',
            onClick: () => {
              console.log('expand!');
              setCollapsed(false);
            }
          },
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
      { collapsed ? null : (
        <Preview />
      )}
    </Resizable>
  );
};

export default ResizablePreview;
