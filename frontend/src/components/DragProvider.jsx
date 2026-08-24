import { createContext, useState } from 'react'

export const DragContext = createContext(null)

export function DragProvider({ children }) {
  const [dragId, setDragId] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)

  return (
    <DragContext.Provider value={{ dragId, dragOverIndex, setDragId, setDragOverIndex }}>
      {children}
    </DragContext.Provider>
  )
}
