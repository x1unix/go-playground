import type { PanelState } from '~/store/state'
import type { SizeChanges } from '~/components/features/inspector/InspectorPanel'

type SizePercent = Pick<PanelState, 'widthPercent'>
type ContainerSize = Pick<HTMLElement, 'offsetHeight' | 'offsetWidth'>

/**
 * Convert absolute element size to percents based on parent element size
 *
 * @param elemSize Absolute child size
 * @param offsetHeight Parent height
 * @param offsetWidth Parent width
 */
export const computeSizePercentage = (
  elemSize: SizeChanges,
  { offsetHeight, offsetWidth }: ContainerSize,
): SizePercent => {
  const resultKey = 'height' in elemSize ? 'heightPercent' : 'widthPercent'
  const absVal = 'height' in elemSize ? elemSize.height : elemSize.width
  const totalVal = 'height' in elemSize ? offsetHeight : offsetWidth
  return { [resultKey]: (absVal * 100) / totalVal }
}
