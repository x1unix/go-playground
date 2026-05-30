import { describe, expect, test } from 'vitest'

import { EvalEventKind } from '~/services/api'
import { isEventPrefix } from './utils'

describe('isEventPrefix', () => {
  test('returns true when rendered events are an exact prefix of current events', () => {
    expect(
      isEventPrefix(
        [{ Kind: EvalEventKind.Stderr, Message: 'build\n', Delay: 0 }],
        [
          { Kind: EvalEventKind.Stderr, Message: 'build\n', Delay: 0 },
          { Kind: EvalEventKind.Stdout, Message: 'Hello\n', Delay: 0 },
        ],
      ),
    ).toBe(true)
  })

  test('returns false when current events diverge from rendered events', () => {
    expect(
      isEventPrefix(
        [{ Kind: EvalEventKind.Stdout, Message: 'Hello\n', Delay: 0 }],
        [{ Kind: EvalEventKind.Stderr, Message: 'build\n', Delay: 0 }],
      ),
    ).toBe(false)
  })

  test('returns false when rendered events are longer than current events', () => {
    expect(
      isEventPrefix(
        [
          { Kind: EvalEventKind.Stderr, Message: 'build\n', Delay: 0 },
          { Kind: EvalEventKind.Stdout, Message: 'Hello\n', Delay: 0 },
        ],
        [{ Kind: EvalEventKind.Stderr, Message: 'build\n', Delay: 0 }],
      ),
    ).toBe(false)
  })
})
