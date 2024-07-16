interface GoProgramInfo {
  isTest?: boolean
  hasBenchmark?: boolean
  hasFuzz?: boolean
}

/**
 * Returns command line args for Go test binary based on server build response.
 */
export const buildGoTestFlags = ({ isTest, hasBenchmark, hasFuzz }: GoProgramInfo): string[] => {
  const flags: Array<[string, boolean | undefined]> = [
    ['-test.v', isTest],
    ['-test.bench=.', hasBenchmark],
    ['-test.fuzz=.', hasFuzz],
  ]

  return flags.filter(([, keep]) => !!keep).map(([arg]) => arg)
}
