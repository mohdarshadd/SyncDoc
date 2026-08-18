import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const TITLES = {
  '/': 'SyncDoc - Collaborative documents',
  '/join': 'SyncDoc - Join workspace',
  '/documents': 'SyncDoc - My documents'
}

export default function usePageTitle() {
  const { pathname } = useLocation()

  useEffect(() => {
    if (pathname.startsWith('/editor/')) {
      document.title = 'SyncDoc - Editing document'
    } else {
      document.title = TITLES[pathname] || 'SyncDoc'
    }
  }, [pathname])
}
