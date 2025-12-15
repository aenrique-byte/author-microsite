import { useEffect, useMemo, useState } from 'react'
import { Download, Mail, RefreshCcw, Users } from 'lucide-react'

interface RecentSignup {
  id: number
  email: string
  created_at: string
  source: string | null
  is_confirmed: boolean
  notify_chapters?: number
  notify_blog?: number
  notify_gallery?: number
}

interface NewsletterStats {
  total_subscribers: number
  confirmed_subscribers: number
  unconfirmed_subscribers: number
  unsubscribed: number
  confirmation_rate: number
  by_source: Record<string, number>
  by_preference: {
    notify_chapters: number
    notify_blog: number
    notify_gallery: number
  }
  recent_signups: RecentSignup[]
}

export default function NewsletterManager() {
  const [stats, setStats] = useState<NewsletterStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    fetchStats()
  }, [])

  const activeSubscribers = useMemo(() => {
    if (!stats) return 0
    return Math.max(stats.total_subscribers - stats.unsubscribed, 0)
  }, [stats])

  const fetchStats = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/newsletter/stats.php', {
        credentials: 'same-origin'
      })
      if (!res.ok) throw new Error('Failed to load stats')
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Failed to load stats')
      setStats(data)
    } catch (err) {
      console.error(err)
      setError('Unable to load newsletter stats')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      setExporting(true)
      const res = await fetch('/api/newsletter/export.php', {
        credentials: 'same-origin'
      })
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'newsletter-subscribers.csv'
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
      setError('Unable to export subscribers')
    } finally {
      setExporting(false)
    }
  }

  const sourceEntries = useMemo(() => {
    if (!stats?.by_source) return []
    const total = Object.values(stats.by_source).reduce((sum, count) => sum + count, 0)
    return Object.entries(stats.by_source).map(([source, count]) => ({
      source,
      count,
      percent: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
    }))
  }, [stats])

  const confirmationRateLabel = useMemo(() => {
    if (!stats) return '0%'
    const rate = Number.isFinite(stats.confirmation_rate) ? stats.confirmation_rate : 0
    return `${rate.toFixed(1)}%`
  }, [stats])

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <p className="text-gray-700 dark:text-gray-300">Loading newsletter stats...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchStats}
          className="mt-4 inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          <RefreshCcw className="w-4 h-4" />
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Mail className="w-6 h-6 text-emerald-500" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Newsletter Dashboard</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">Track subscribers and engagement sources.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchStats}
            className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 shadow-sm transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800"
          >
            <RefreshCcw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex items-center gap-2 rounded-md bg-emerald-500 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-600 disabled:opacity-60"
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>

      {stats && (
        <div className="mt-6 space-y-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard label="Total Subscribers" value={stats.total_subscribers} icon={<Users className="w-5 h-5" />} />
            <StatCard label="Confirmed" value={stats.confirmed_subscribers} accent="text-emerald-600" />
            <StatCard label="Unconfirmed" value={stats.unconfirmed_subscribers} accent="text-amber-600" />
            <StatCard label="Unsubscribed" value={stats.unsubscribed} accent="text-red-600" />
            <StatCard label="Confirmation Rate" value={confirmationRateLabel} accent="text-blue-600" />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Sources</h3>
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">Based on {activeSubscribers} active subscriptions.</p>
              {sourceEntries.length === 0 ? (
                <p className="text-sm text-gray-600 dark:text-gray-300">No source data yet.</p>
              ) : (
                <div className="space-y-2">
                  {sourceEntries.map((entry) => (
                    <div key={entry.source} className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2 text-sm dark:bg-gray-900">
                      <span className="text-gray-700 dark:text-gray-200">{entry.source}</span>
                      <div className="flex items-center gap-3 text-gray-900 dark:text-white">
                        <span className="font-semibold">{entry.count}</span>
                        <span className="text-xs text-gray-600 dark:text-gray-300">{entry.percent}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Preferences</h3>
              <div className="space-y-2 text-sm text-gray-700 dark:text-gray-200">
                <PrefRow label="New chapters" value={stats.by_preference.notify_chapters} />
                <PrefRow label="Blog posts" value={stats.by_preference.notify_blog} />
                <PrefRow label="Image galleries" value={stats.by_preference.notify_gallery} />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Recent signups</h3>
            {stats.recent_signups.length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-300">No signups yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-200">Email</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-200">Source</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-200">Status</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-200">Preferences</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-200">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {stats.recent_signups.map((signup) => (
                      <tr key={signup.id}>
                        <td className="px-4 py-2 text-gray-900 dark:text-white">{maskEmail(signup.email)}</td>
                        <td className="px-4 py-2 text-gray-700 dark:text-gray-200">{signup.source || 'unknown'}</td>
                        <td className="px-4 py-2">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                              signup.is_confirmed
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200'
                            }`}
                          >
                            {signup.is_confirmed ? 'Confirmed' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-gray-700 dark:text-gray-200">{formatPreferences(signup)}</td>
                        <td className="px-4 py-2 text-gray-700 dark:text-gray-200">{new Date(signup.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string
  value: number | string
  icon?: JSX.Element
  accent?: string
}) {
  return (
    <div className="rounded-lg border border-gray-200 p-4 shadow-sm dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-300">{label}</p>
          <p className={`mt-1 text-2xl font-semibold text-gray-900 dark:text-white ${accent || ''}`}>{value}</p>
        </div>
        {icon && <div className="text-gray-500 dark:text-gray-300">{icon}</div>}
      </div>
    </div>
  )
}

function PrefRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2 dark:bg-gray-900">
      <span>{label}</span>
      <span className="font-semibold text-gray-900 dark:text-white">{value}</span>
    </div>
  )
}

function maskEmail(email: string) {
  const [user, domain] = email.split('@')
  if (!domain) return email
  if (user.length <= 2) {
    return `${user.slice(0, 1)}***@${domain}`
  }
  return `${user.slice(0, 1)}***${user.slice(-1)}@${domain}`
}

function formatPreferences(signup: RecentSignup) {
  const icons = [] as string[]
  if (signup.notify_chapters) icons.push('📖')
  if (signup.notify_blog) icons.push('✍️')
  if (signup.notify_gallery) icons.push('🖼️')
  return icons.length ? icons.join(' ') : '—'
}
