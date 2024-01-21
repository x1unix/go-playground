import React, { useCallback } from 'react';
import { useTheme } from '@fluentui/react';
import { Resizable } from 're-resizable';
import clsx from 'clsx';
import {
  VscChevronDown,
  VscChevronUp,
  VscSplitHorizontal,
  VscSplitVertical
} from 'react-icons/vsc';

import { ConnectedRunOutput } from '../RunOutput';
import { PanelHeader } from '~/components/elements/panel/PanelHeader';
import {LayoutType, DEFAULT_PANEL_HEIGHT, DEFAULT_PANEL_WIDTH} from '~/styles/layout';
import './InspectorPanel.css';

const MIN_HEIGHT = 36;
const MIN_WIDTH = 120;
const handleClasses = {
  top: 'InspectorPanel__handle--top',
  left: 'InspectorPanel__handle--left',
}

export interface ResizePanelParams {
  layout?: LayoutType
  collapsed?: boolean
  height?: string|number
  width?: string|number
}

interface Props extends ResizePanelParams {
  onViewChange?: (changes: ResizePanelParams) => void
}

export const InspectorPanel: React.FC<Props> = ({
  layout = LayoutType.Vertical,
  height = DEFAULT_PANEL_HEIGHT,
  width= DEFAULT_PANEL_WIDTH,
  collapsed,
  onViewChange
}) => {
  const {palette: { accent }, semanticColors: { buttonBorder }} = useTheme();
  const onResize = useCallback((e, direction, ref, size) => {
    switch (layout) {
      case LayoutType.Vertical:
        onViewChange?.({ height: height + size.height});
        return;
      case LayoutType.Horizontal:
        onViewChange?.({ width: width + size.width});
        return;
      default:
        return;
    }
  }, [height, width, layout, onViewChange]);

  const size = {
    height: layout === LayoutType.Vertical ? height : '100%',
    width: layout === LayoutType.Horizontal ? width : '100%'
  };

  const enabledCorners = {
    top: !collapsed && layout === LayoutType.Vertical,
    right: false,
    bottom: false,
    left: !collapsed && layout === LayoutType.Horizontal,
    topRight: false,
    bottomRight: false,
    bottomLeft: false,
    topLeft: false
  };

  const isCollapsed = collapsed && layout === LayoutType.Vertical;
  return (
    <Resizable
      className={
        clsx(
          'InspectorPanel',
          isCollapsed && 'InspectorPanel--collapsed',
          `InspectorPanel--${layout}`
        )
      }
      handleClasses={handleClasses}
      size={size}
      enable={enabledCorners}
      onResizeStop={onResize}
      minHeight={MIN_HEIGHT}
      minWidth={MIN_WIDTH}
      style={{
        '--pg-handle-active-color': accent,
        '--pg-handle-default-color': buttonBorder,
      } as any}
    >
      <PanelHeader
        label="Output"
        commands={{
          'vertical-layout': {
            hidden: layout === LayoutType.Vertical,
            icon: <VscSplitVertical />,
            label: 'Use vertical layout',
            onClick: () => onViewChange?.({ layout: LayoutType.Vertical })
          },
          'horizontal-layout': {
            desktopOnly: true,
            hidden: layout === LayoutType.Horizontal,
            icon: <VscSplitHorizontal />,
            label: 'Use horizontal layout',
            onClick: () => onViewChange?.({ layout: LayoutType.Horizontal })
          },
          'collapse': {
            hidden: layout === LayoutType.Horizontal,
            icon: collapsed ? <VscChevronUp /> : <VscChevronDown />,
            label: collapsed ? 'Expand' : 'Collapse',
            onClick: () => onViewChange?.({ collapsed: !collapsed })
          },

        }}
      />
      <div className="InspectorPanel__container" hidden={isCollapsed}>
        <ConnectedRunOutput />
      </div>
    </Resizable>
  );
};
