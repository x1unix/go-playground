import React from 'react'

import { Dialog } from '~/components/elements/modals/Dialog'
import { getSnippetsList } from '~/services/examples'

import { ExamplesSection } from '../ExamplesSection'

interface Props {
  isOpen?: boolean
  onDismiss?: () => void
}

const examples = getSnippetsList()

export const ExamplesModal: React.FC<Props> = ({ isOpen, onDismiss }) => {
  return (
    <Dialog label="Examples" isOpen={isOpen} onDismiss={onDismiss}>
      {Object.entries(examples).map(([label, snippets]) => (
        <ExamplesSection key={label} label={label} snippets={snippets} />
      ))}
    </Dialog>
  )
}
