/**
 * Decompressed content length
 */
const RAW_CONTENT_LENGTH_HEADER = 'x-raw-content-length'
const CONTENT_LENGTH_HEADER = 'content-length'

export interface DownloadProgress {
  totalBytes: number
  currentBytes: number
}

export type ProgressReporter = (progress: DownloadProgress) => void

/**
 * Wraps response object and attaches download progress reporter.
 *
 * @param rsp Response object
 * @param reporter Progress reporter
 */
export const wrapResponseWithProgress = (rsp: Response, reporter: ProgressReporter): Response => {
  const contentLength = rsp.headers.get(RAW_CONTENT_LENGTH_HEADER) ?? rsp.headers.get(CONTENT_LENGTH_HEADER)

  if (!contentLength) {
    console.warn(`Content length header is not available (url: ${rsp.url})`)
    return rsp
  }

  const totalBytes = parseInt(contentLength, 10)
  let readBytes = 0

  return new Response(
    new ReadableStream({
      async start(controller) {
        const reader = rsp.body!.getReader()
        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          readBytes += value?.byteLength ?? 1

          reporter({
            totalBytes,
            currentBytes: readBytes,
          })
          controller.enqueue(value)
        }
        controller.close()
      },
    }),
    {
      headers: rsp.headers,
      status: rsp.status,
      statusText: rsp.statusText,
    },
  )
}
