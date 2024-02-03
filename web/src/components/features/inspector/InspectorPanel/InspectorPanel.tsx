import React, { useCallback } from 'react'
import { useTheme } from '@fluentui/react'
import { Resizable } from 're-resizable'
import clsx from 'clsx'
import { VscChevronDown, VscChevronUp, VscSplitHorizontal, VscSplitVertical } from 'react-icons/vsc'

import { ConnectedRunOutput } from '../RunOutput'
import { PanelHeader } from '~/components/elements/panel/PanelHeader'
import { LayoutType, DEFAULT_PANEL_HEIGHT, DEFAULT_PANEL_WIDTH } from '~/styles/layout'
import './InspectorPanel.css'

const MIN_HEIGHT = 36
const MIN_WIDTH = 120
const handleClasses = {
  top: 'InspectorPanel__handle--top',
  left: 'InspectorPanel__handle--left',
}

export type SizeChanges = { height: number } | { width: number }

export interface Props {
  layout?: LayoutType
  collapsed?: boolean
  heightPercent?: number
  widthPercent?: number
  onResize?: (size: SizeChanges) => void
  onLayoutChange?: (layout: LayoutType) => void
  onCollapsed?: (collapsed: boolean) => void
}

export const InspectorPanel: React.FC<Props> = ({
  layout = LayoutType.Vertical,
  heightPercent = DEFAULT_PANEL_HEIGHT,
  widthPercent = DEFAULT_PANEL_WIDTH,
  collapsed,
  onResize,
  onLayoutChange,
  onCollapsed,
}) => {
  const {
    palette: { accent },
    semanticColors: { buttonBorder },
  } = useTheme()
  const handleResize = useCallback(
    (e, direction, ref) => {
      const { offsetHeight, offsetWidth } = ref
      switch (layout) {
        case LayoutType.Vertical:
          onResize?.({ height: offsetHeight })
          return
        case LayoutType.Horizontal:
          onResize?.({ width: offsetWidth })
          break
        default:
      }
    },
    [layout, onResize],
  )

  const size = {
    height: layout === LayoutType.Vertical ? `${heightPercent}%` : '100%',
    width: layout === LayoutType.Horizontal ? `${widthPercent}%` : '100%',
  }

  const enabledCorners = {
    top: !collapsed && layout === LayoutType.Vertical,
    right: false,
    bottom: false,
    left: !collapsed && layout === LayoutType.Horizontal,
    topRight: false,
    bottomRight: false,
    bottomLeft: false,
    topLeft: false,
  }

  const isCollapsed = collapsed && layout === LayoutType.Vertical
  return (
    <Resizable
      className={clsx('InspectorPanel', isCollapsed && 'InspectorPanel--collapsed', `InspectorPanel--${layout}`)}
      handleClasses={handleClasses}
      size={size}
      enable={enabledCorners}
      onResizeStop={handleResize}
      minHeight={MIN_HEIGHT}
      minWidth={MIN_WIDTH}
      style={
        {
          '--pg-handle-active-color': accent,
          '--pg-handle-default-color': buttonBorder,
        } as any
      }
    >
      <PanelHeader
        label="Output"
        commands={{
          'vertical-layout': {
            hidden: layout === LayoutType.Vertical,
            icon: <VscSplitVertical />,
            label: 'Use vertical layout',
            onClick: () => onLayoutChange?.(LayoutType.Vertical),
          },
          'horizontal-layout': {
            desktopOnly: true,
            hidden: layout === LayoutType.Horizontal,
            icon: <VscSplitHorizontal />,
            label: 'Use horizontal layout',
            onClick: () => onLayoutChange?.(LayoutType.Horizontal),
          },
          collapse: {
            hidden: layout === LayoutType.Horizontal,
            icon: collapsed ? <VscChevronUp /> : <VscChevronDown />,
            label: collapsed ? 'Expand' : 'Collapse',
            onClick: () => onCollapsed?.(!collapsed),
          },
        }}
      />
      <div className="InspectorPanel__container" hidden={isCollapsed}>
        <ConnectedRunOutput />
      </div>
    </Resizable>
  )
}
