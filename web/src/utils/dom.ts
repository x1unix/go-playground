export const isTouchDevice = () => 'ontouchstart' in window || navigator.maxTouchPoints > 0

export const isAppleDevice = () => /(iPad|iPhone|iPod|Mac)/g.test(navigator.userAgent)

/**
 * Returns name of a Ctrl or Command key label depending on user agent.
 *
 * Used to highlight shortcut key combinations.
 * @returns
 */
export const controlKeyLabel = () => (isAppleDevice() ? '⌘' : 'Ctrl')
