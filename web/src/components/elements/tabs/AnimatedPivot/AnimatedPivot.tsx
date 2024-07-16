import React, { useState } from 'react'
import {
  type IPivotStyles,
  mergeStyleSets,
  MotionAnimations,
  MotionDurations,
  Pivot,
  type PivotItem,
} from '@fluentui/react'

// defaultIndex is based on a default value of pivot with empty value
const defaultSelectedKey = '.0'

interface Props extends React.ComponentProps<typeof Pivot> {
  label?: string
}

interface State {
  currentKey: string
  pivotAnimation: string
}

const pivotStyles: Partial<IPivotStyles> = {
  itemContainer: {
    // Set height to highest of pivots. See: #371
    animation: 'var(--settings-pivot-animation, none)',
    animationDuration: MotionDurations.duration3,
  },
}

/**
 * Extracts pivot key from item. Falls back to React's key if undefined.
 */
const getPivotItemKey = (item?: PivotItem) =>
  item?.props.itemKey ?? (item && 'key' in item ? (item.key as string) : undefined)

const getPivotAnimation = (prevKey: string, nextKey?: string): string => {
  if (!nextKey || prevKey === nextKey) {
    return 'none'
  }

  return prevKey > nextKey ? MotionAnimations.slideRightIn : MotionAnimations.slideLeftIn
}

const getInitialKey = (props: Pick<Props, 'children' | 'defaultSelectedKey'>): string => {
  if (props.defaultSelectedKey) return props.defaultSelectedKey

  return getPivotItemKey(props.children?.[0]) ?? defaultSelectedKey
}

/**
 * AnimatedPivot component is an extension of fluent's Pivot with animated pivot transitions.
 */
export const AnimatedPivot: React.FC<Props> = ({ label, styles, onLinkClick, ...props }) => {
  const [state, setState] = useState<State>({
    currentKey: getInitialKey(props),
    pivotAnimation: 'none',
  })

  const cssVars: Record<string, string> = {
    '--settings-pivot-animation': state.pivotAnimation,
  }

  const handleTabChange = (item?: PivotItem, ev?: React.MouseEvent<HTMLElement>) => {
    const pivotKey = getPivotItemKey(item)
    const oldKey = state.currentKey
    setState({
      currentKey: pivotKey ?? oldKey,
      pivotAnimation: getPivotAnimation(oldKey, pivotKey),
    })

    onLinkClick?.(item, ev)
  }

  return (
    <Pivot
      {...props}
      aria-label={label}
      onLinkClick={handleTabChange}
      style={cssVars}
      styles={mergeStyleSets(pivotStyles, styles)}
    />
  )
}
