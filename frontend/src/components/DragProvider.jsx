import { createContext, useState } from 'react'

export const DragContext = createContext(null)

export function DragProvider({ children }) {
  const [activeId, setActiveId] = useState(null)
  const [overId, setOverId] = useState(null)
  const [insertIndex, setInsertIndex] = useState(null)

  return (
    <DragContext.Provider value={{ activeId, overId, insertIndex, setActiveId, setOverId, setInsertIndex }}>
      {children}
    </DragContext.Provider>
  )
}
