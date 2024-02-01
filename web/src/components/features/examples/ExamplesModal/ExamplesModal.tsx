import React from 'react'
import { Dialog } from '~/components/elements/modals/Dialog'
import { getSnippetsList } from '~/services/examples'

import { ExamplesSection } from '../ExamplesSection'
import type { Snippet } from '~/services/examples'

interface Props {
  isOpen?: boolean
  onDismiss?: () => void
  onSelect?: (snippet: Snippet) => void
}

const examples = getSnippetsList()

const modalStyles = {
  main: {
    maxWidth: 840,
  },
}

export const ExamplesModal: React.FC<Props> = ({ isOpen, onDismiss, onSelect }) => {
  return (
    <Dialog label="Examples" styles={modalStyles} isOpen={isOpen} onDismiss={onDismiss}>
      {Object.entries(examples).map(([label, snippets]) => (
        <ExamplesSection key={label} label={label} snippets={snippets} onSelect={onSelect} />
      ))}
    </Dialog>
  )
}
