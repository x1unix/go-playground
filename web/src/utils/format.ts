const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

export const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const i: number = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i]
}

export const formatDuration = (milliseconds: number): string => {
  const msInSecond = 1000
  const msInMinute = msInSecond * 60
  const msInHour = msInMinute * 60

  const hours = Math.floor(milliseconds / msInHour)
  const minutes = Math.floor((milliseconds % msInHour) / msInMinute)
  const seconds = Math.floor((milliseconds % msInMinute) / msInSecond)
  const ms = milliseconds % msInSecond

  const hoursStr = hours > 0 ? `${hours}h ` : ''
  const minutesStr = minutes > 0 ? `${minutes}m ` : ''
  const secondsStr = seconds > 0 ? `${seconds}s ` : ''
  const msStr = ms > 0 ? `${ms}ms` : ''

  return (hoursStr + minutesStr + secondsStr + msStr).trim()
}
