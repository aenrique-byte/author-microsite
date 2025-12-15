import { useEffect, useMemo, useState } from 'react'
import type React from 'react'
import { useTheme } from '../features/storytime/contexts/ThemeContext'

interface NewsletterDrawerProps {
  isOpen: boolean
  onClose: () => void
  source: string
  defaultMessage?: string
  showPatreonLink?: boolean
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function NewsletterDrawer({
  isOpen,
  onClose,
  source,
  defaultMessage,
  showPatreonLink = true,
}: NewsletterDrawerProps) {
  const { theme } = useTheme()
  const [email, setEmail] = useState('')
  const [preferences, setPreferences] = useState({
    chapters: true,
    blog: true,
    gallery: true,
  })
  const [submitting, setSubmitting] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [serverMessage, setServerMessage] = useState<string | null>(null)

  const baseSuccessMessage = useMemo(
    () => defaultMessage || "Thanks! Check your email to confirm.",
    [defaultMessage]
  )

  useEffect(() => {
    if (!isOpen) {
      setEmail('')
      setPreferences({ chapters: true, blog: true, gallery: true })
      setSubmitting(false)
      setHasSubmitted(false)
      setError(null)
      setServerMessage(null)
    }
  }, [isOpen])

  const togglePreference = (key: 'chapters' | 'blog' | 'gallery') => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedEmail = email.trim()

    if (!emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid email address.')
      return
    }

    setError(null)
    setSubmitting(true)

    try {
      const res = await fetch('/api/newsletter/subscribe.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: trimmedEmail,
          notify_chapters: preferences.chapters,
          notify_blog: preferences.blog,
          notify_gallery: preferences.gallery,
          source,
        }),
      })

      const data = await res.json().catch(() => null)
      if (data?.message) {
        setServerMessage(data.message)
      }
    } catch (err) {
      console.warn('Newsletter signup request failed', err)
    } finally {
      setHasSubmitted(true)
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  const textPrimary = theme === 'light' ? 'text-gray-900' : 'text-white'
  const textSecondary = theme === 'light' ? 'text-gray-700' : 'text-neutral-200'
  const cardBg = theme === 'light'
    ? 'bg-white border-gray-200'
    : 'bg-neutral-900 border-white/10'
  const inputBg = theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-white/5 border-white/10'

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        className={`relative w-full sm:max-w-xl ${cardBg} border rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl translate-y-0 sm:translate-y-0 animate-slide-up`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className={`text-xs font-semibold uppercase tracking-[0.18em] text-emerald-500`}>Newsletter</p>
            <h2 className={`mt-2 text-2xl font-bold ${textPrimary}`}>Stay in the loop</h2>
            <p className={`mt-2 text-sm ${textSecondary}`}>
              Get updates when new chapters, blog posts, or galleries go live. Choose what you want to hear about.
            </p>
          </div>
          <button
            onClick={onClose}
            className={`h-10 w-10 grid place-items-center rounded-full ${
              theme === 'light' ? 'bg-gray-100 hover:bg-gray-200 text-gray-600' : 'bg-white/10 hover:bg-white/20 text-white'
            } transition-colors`}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {!hasSubmitted ? (
          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className={`text-sm font-medium ${textPrimary}`}>Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`mt-2 w-full rounded-xl px-4 py-3 ${inputBg} focus:outline-none focus:ring-2 focus:ring-emerald-500 transition`}
                placeholder="you@example.com"
                required
              />
              {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
            </div>

            <div>
              <p className={`text-sm font-medium ${textPrimary} mb-2`}>What should I send you?</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <label className={`flex items-center gap-2 rounded-xl border px-3 py-2 cursor-pointer ${
                  preferences.chapters ? 'border-emerald-400 bg-emerald-50/50 dark:bg-emerald-500/10' : 'border-gray-200 dark:border-white/10'
                } ${textSecondary}`}>
                  <input
                    type="checkbox"
                    checked={preferences.chapters}
                    onChange={() => togglePreference('chapters')}
                    className="rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span>New chapters</span>
                </label>
                <label className={`flex items-center gap-2 rounded-xl border px-3 py-2 cursor-pointer ${
                  preferences.blog ? 'border-emerald-400 bg-emerald-50/50 dark:bg-emerald-500/10' : 'border-gray-200 dark:border-white/10'
                } ${textSecondary}`}>
                  <input
                    type="checkbox"
                    checked={preferences.blog}
                    onChange={() => togglePreference('blog')}
                    className="rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span>Blog posts</span>
                </label>
                <label className={`flex items-center gap-2 rounded-xl border px-3 py-2 cursor-pointer ${
                  preferences.gallery ? 'border-emerald-400 bg-emerald-50/50 dark:bg-emerald-500/10' : 'border-gray-200 dark:border-white/10'
                } ${textSecondary}`}>
                  <input
                    type="checkbox"
                    checked={preferences.gallery}
                    onChange={() => togglePreference('gallery')}
                    className="rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span>Image galleries</span>
                </label>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition disabled:opacity-70"
              >
                {submitting ? 'Joining...' : 'Join the mailing list'}
              </button>
              {showPatreonLink && (
                <a
                  href="https://www.patreon.com"
                  target="_blank"
                  rel="noreferrer"
                  className={`text-sm font-semibold ${textSecondary} hover:brand-text`}
                >
                  Already subscribed? Support me on Patreon →
                </a>
              )}
            </div>
          </form>
        ) : (
          <div className={`mt-6 rounded-2xl border ${cardBg} px-4 py-5 text-center`}>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
              ✓
            </div>
            <p className={`mt-4 text-lg font-semibold ${textPrimary}`}>{serverMessage || baseSuccessMessage}</p>
            <p className={`mt-2 text-sm ${textSecondary}`}>
              Check your inbox for a confirmation link. If you don't see it, check spam.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
