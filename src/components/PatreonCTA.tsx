import { useEffect, useMemo, useState } from 'react'
import { useTheme } from '../features/storytime/contexts/ThemeContext'

interface PatreonCTAProps {
  variant: 'button' | 'card' | 'banner'
  className?: string
  url?: string
}

const fallbackUrl = 'https://www.patreon.com/cw/oc_wanderer'

export default function PatreonCTA({ variant, className = '', url }: PatreonCTAProps) {
  const { theme } = useTheme()
  const [resolvedUrl, setResolvedUrl] = useState(url || '')

  useEffect(() => {
    if (url) {
      setResolvedUrl(url)
      return
    }

    let cancelled = false

    ;(async () => {
      try {
        const res = await fetch('/api/socials/get.php', { credentials: 'same-origin', cache: 'no-cache' })
        if (res.ok) {
          const data = await res.json().catch(() => null)
          const patreon = data?.socials?.patreon || data?.patreon
          if (!cancelled && patreon) {
            setResolvedUrl(patreon)
          }
        }
      } catch {
        // ignore fetch errors
      } finally {
        if (!cancelled) {
          setResolvedUrl((current) => current || fallbackUrl)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [url])

  const targetUrl = useMemo(() => resolvedUrl || url || fallbackUrl, [resolvedUrl, url])

  const textPrimary = theme === 'light' ? 'text-gray-900' : 'text-white'
  const textSecondary = theme === 'light' ? 'text-gray-700' : 'text-neutral-200'
  const cardBg = theme === 'light'
    ? 'bg-gradient-to-r from-orange-50 via-white to-amber-50 border-orange-200'
    : 'bg-gradient-to-r from-orange-900/40 via-neutral-900 to-amber-900/30 border-white/10'

  const buttonClasses =
    'inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2'

  if (!targetUrl) return null

  if (variant === 'button') {
    return (
      <a
        href={targetUrl}
        target="_blank"
        rel="noreferrer"
        className={`${buttonClasses} ${className}`}
      >
        ✦ Support on Patreon
      </a>
    )
  }

  if (variant === 'banner') {
    return (
      <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 border rounded-2xl p-5 ${cardBg} ${className}`}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-500">Patreon</p>
          <h3 className={`text-xl font-bold ${textPrimary}`}>Love the stories?</h3>
          <p className={`text-sm ${textSecondary}`}>
            Join on Patreon for early chapters, behind-the-scenes notes, and to keep the adventures coming.
          </p>
        </div>
        <a href={targetUrl} target="_blank" rel="noreferrer" className={buttonClasses}>
          Become a patron
        </a>
      </div>
    )
  }

  return (
    <div className={`flex flex-col sm:flex-row items-center gap-3 border rounded-2xl p-5 ${cardBg} ${className}`}>
      <div className="grid h-12 w-12 place-items-center rounded-full bg-orange-500/15 text-orange-500">✦</div>
      <div className="flex-1">
        <h3 className={`text-lg font-bold ${textPrimary}`}>Fuel the journey</h3>
        <p className={`text-sm ${textSecondary}`}>
          Get early access, vote on what comes next, and support the author directly.
        </p>
      </div>
      <a href={targetUrl} target="_blank" rel="noreferrer" className={buttonClasses}>
        Support on Patreon
      </a>
    </div>
  )
}
