import { useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function AppInstallMetadata() {
  const { pathname } = useLocation()
  useLayoutEffect(() => {
    const admin = pathname === '/admin' || pathname.startsWith('/admin/')
    const manifest = document.querySelector('link[rel="manifest"]')
    if (manifest) manifest.setAttribute('href', admin ? '/admin.webmanifest' : '/manifest.webmanifest')
    document.querySelectorAll('link[rel="apple-touch-icon"]').forEach(link => {
      link.setAttribute('href', admin ? '/icons/admin-180.png' : '/icons/agenda-180.png')
      link.setAttribute('sizes', '180x180')
    })
    const title = document.querySelector('meta[name="apple-mobile-web-app-title"]')
    if (title) title.setAttribute('content', admin ? 'MK Admin' : 'MK e Balão')
  }, [pathname])
  return null
}
