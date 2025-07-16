import React, { useEffect, useState, useRef } from 'react'

interface Props {
  siteKey: string | null | undefined
  className?: string
  onSuccess: (token: string) => void
  renderError: (err: string) => React.ReactNode
}

export const TurnstileChallenge: React.FC<Props> = ({ siteKey, className, onSuccess, renderError }) => {
  const [err, setErr] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!containerRef.current) {
      return
    }

    if (!siteKey || !turnstile) {
      setErr('WAF challenge requested but Turnstille is not available')
      return
    }

    turnstile.render(containerRef.current, {
      sitekey: siteKey,
      'error-callback': (errMsg) => setErr(errMsg),
      callback: onSuccess,
    })
  }, [containerRef.current, setErr, siteKey])

  return (
    <div className={className}>
      {err ? renderError(err) : null}
      <div ref={containerRef} />
    </div>
  )
}
