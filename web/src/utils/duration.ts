/**
 * Number of milliseconds in nanosecond
 */
export const MSEC_IN_NANOSEC = 1000000

/**
 * Number of nanoseconds in a second.
 */
export const SECOND = 1000 * MSEC_IN_NANOSEC

/**
 * Converts nanoseconds to milliseconds
 * @param ns Delay in anoseconds
 * @param round Round to integer
 */
export const nsToMs = (ns: number, round = false) => (ns < MSEC_IN_NANOSEC ? 0 : Math.floor(ns / MSEC_IN_NANOSEC))

/**
 * Calls setTimeout with duration in nanoseconds
 * @param cb
 * @param timeoutNs
 */
export const setTimeoutNanos = (cb: Function, timeoutNs: number) => setTimeout(cb, nsToMs(timeoutNs, true))
