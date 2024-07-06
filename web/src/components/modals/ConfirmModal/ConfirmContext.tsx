import React, { createContext, useState, useContext } from 'react'
import { ConfirmModal, type ConfirmProps } from './ConfirmModal'

export type ConfirmArgs = Omit<ConfirmProps, 'isOpen' | 'onResult'>

const ConfirmModalContext = createContext<{
  showConfirm: (args: ConfirmArgs) => Promise<boolean>
}>({
  showConfirm: async () => {
    throw new Error('ConfirmModalContext is not mounted')
  },
})

export const useConfirmModal = () => useContext(ConfirmModalContext)

const initialState: ConfirmProps = { isOpen: false, title: '', message: '' }

interface ProviderProps {
  children: React.ReactNode | React.ReactNode[]
}

export const ConfirmProvider = ({ children }: ProviderProps) => {
  const [state, setState] = useState<ConfirmProps>(initialState)

  const showConfirm = async (args: ConfirmArgs) => {
    return await new Promise<boolean>((resolve) => {
      const onResult = (result: boolean) => {
        // Keep old title and message to avoid flicker during animation.
        setState(args)
        return resolve(result)
      }

      setState({ ...args, isOpen: true, onResult })
    })
  }

  return (
    <ConfirmModalContext.Provider value={{ showConfirm }}>
      {children}
      <ConfirmModal {...state} />
    </ConfirmModalContext.Provider>
  )
}
