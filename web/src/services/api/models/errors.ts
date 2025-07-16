export class CFError extends Error {
  public readonly isCFError = true

  constructor(public mitigationType: string) {
    super(`Cloudflare WAF returned cf-mitigated: ${mitigationType}`)
  }
}

/**
 * Checks whether error is Cloudflare WAF challenge error.
 */
export const isCFError = (err: any): err is CFError => {
  return typeof err === 'object' && 'isCFError' in err && err.isCFError
}
