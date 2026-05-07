import { createContext, useContext, useEffect } from 'react'
import { RootStore } from './RootStore'

let store: RootStore | null = null

function getStore() {
  if (!store) store = new RootStore()
  return store
}

const StoreContext = createContext<RootStore | null>(null)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const rootStore = getStore()

  useEffect(() => {
    rootStore.auth.hydrate()
  }, [rootStore])

  return (
    <StoreContext.Provider value={rootStore}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside StoreProvider')
  return ctx
}
