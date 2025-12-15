import { useState, useEffect } from 'react'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface AnalyticsSummary {
  total_views: number
  unique_visitors: number
  story_views: number
  chapter_views: number
  gallery_views: number
  avg_reading_depth: number
}

interface TopStory {
  story_slug: string
  views: number
}

interface DailyTrend {
  date: string
  views: number
}

interface SummaryData {
  summary: AnalyticsSummary
  top_stories: TopStory[]
  daily_trend: DailyTrend[]
  period_days: number
}

interface VisitorData {
  unique_visitors: number
  total_sessions: number
  new_visitors: number
  returning_visitors: number
  repeat_visitors: number
  repeat_visitor_rate: number
  avg_session_duration: number
  avg_pages_per_session: number
  daily_visitors: Array<{
    date: string
    unique_visitors: number
    sessions: number
  }>
  period_days: number
}

interface GeographyData {
  top_countries: Array<{
    country_code: string
    unique_visitors: number
    sessions: number
    total_events: number
  }>
  top_regions: Array<{
    region: string
    country_code: string
    unique_visitors: number
    sessions: number
  }>
  top_cities: Array<{
    city: string
    region: string
    country_code: string
    unique_visitors: number
    sessions: number
  }>
  period_days: number
}

interface ActivityData {
  recent_sessions: Array<{
    session_id: string
    ip_hash: string
    first_seen: string
    last_seen: string
    duration_seconds: number
    page_views: number
    country_code: string
    region: string | null
    city: string | null
    user_agent: string
    event_types: string
  }>
  hourly_activity: Array<{
    hour: number
    sessions: number
    unique_visitors: number
    events: number
  }>
  weekly_activity: Array<{
    day_of_week: number
    day_name: string
    sessions: number
    unique_visitors: number
    events: number
  }>
  device_breakdown: Array<{
    device_type: string
    unique_visitors: number
    sessions: number
  }>
  browser_breakdown: Array<{
    browser: string
    unique_visitors: number
    sessions: number
  }>
  referrer_breakdown: Array<{
    referrer: string
    sessions: number
    unique_visitors: number
  }>
  period_days: number
}

interface StoryListItem {
  id: number
  slug: string
  title: string
  status: string
  total_chapters: number
  total_likes: number
  total_comments: number
  story_views: number
  chapter_views: number
  total_views: number
  unique_readers: number
  avg_reading_depth: number
}

interface ChapterAnalytics {
  id: number
  title: string
  chapter_number: number
  chapter_slug: string
  status: string
  likes: number
  comments: number
  views: number
  unique_readers: number
  avg_reading_depth: number
  avg_time_spent: number
}

interface StoryData {
  stories?: StoryListItem[]
  story?: {
    id: number
    slug: string
    title: string
  }
  chapters?: ChapterAnalytics[]
  period_days: number
}

interface GalleryListItem {
  id: number
  slug: string
  title: string
  status: string
  rating: string
  total_images: number
  total_likes: number
  total_comments: number
  gallery_views: number
  image_views: number
  total_views: number
  unique_visitors: number
}

interface ImageAnalytics {
  id: number
  title: string | null
  filename: string
  sort_order: number
  likes: number
  comments: number
  views: number
  unique_viewers: number
}

interface GalleryData {
  galleries?: GalleryListItem[]
  gallery?: {
    id: number
    slug: string
    title: string
    rating: string
  }
  images?: ImageAnalytics[]
  period_days: number
}

interface BlogPostItem {
  id: number
  slug: string
  title: string
  status: string
  view_count: number
  like_count: number
  comment_count: number
  reading_time: number
  published_at: string | null
  created_at: string
  period_views: number
  period_likes: number
  period_shares: number
  unique_visitors: number
}

interface BlogData {
  posts?: BlogPostItem[]
  post?: {
    id: number
    slug: string
    title: string
    status: string
    view_count: number
    like_count: number
  }
  summary?: {
    total_views: number
    total_likes: number
    total_shares: number
    unique_visitors: number
    posts_with_views: number
    published_count: number
    draft_count: number
    scheduled_count: number
  }
  totals?: {
    total_views: number
    total_likes: number
    total_shares: number
    unique_visitors: number
  }
  daily_trend?: Array<{
    date: string
    views: number
    likes: number
    unique_visitors: number
  }>
  daily_stats?: Array<{
    date: string
    views: number
    likes: number
    shares: number
    unique_visitors: number
  }>
  referrers?: Array<{
    source: string
    count: number
    unique_visitors: number
  }>
  countries?: Array<{
    country_code: string
    views: number
    unique_visitors: number
  }>
  period_days: number
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

export default function AnalyticsManager() {
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null)
  const [visitorData, setVisitorData] = useState<VisitorData | null>(null)
  const [geographyData, setGeographyData] = useState<GeographyData | null>(null)
  const [activityData, setActivityData] = useState<ActivityData | null>(null)
  const [storyData, setStoryData] = useState<StoryData | null>(null)
  const [galleryData, setGalleryData] = useState<GalleryData | null>(null)
  const [blogData, setBlogData] = useState<BlogData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filters
  const [days, setDays] = useState(30)
  const [activeTab, setActiveTab] = useState<'overview' | 'visitors' | 'geography' | 'activity' | 'stories' | 'galleries' | 'blog'>('overview')
  const [selectedStoryId, setSelectedStoryId] = useState<number | null>(null)
  const [selectedGalleryId, setSelectedGalleryId] = useState<number | null>(null)
  const [selectedBlogPostId, setSelectedBlogPostId] = useState<number | null>(null)

  useEffect(() => {
    loadAnalyticsData()
  }, [days])

  useEffect(() => {
    if (activeTab === 'stories') {
      loadStoryData()
    }
  }, [activeTab, selectedStoryId, days])

  useEffect(() => {
    if (activeTab === 'galleries') {
      loadGalleryData()
    }
  }, [activeTab, selectedGalleryId, days])

  useEffect(() => {
    if (activeTab === 'blog') {
      loadBlogData()
    }
  }, [activeTab, selectedBlogPostId, days])

  const loadBlogData = async () => {
    try {
      const url = selectedBlogPostId
        ? `/api/admin/analytics/blog-details.php?days=${days}&post_id=${selectedBlogPostId}`
        : `/api/admin/analytics/blog-details.php?days=${days}`

      const response = await fetch(url, { credentials: 'same-origin' })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setBlogData(result.data)
        }
      }
    } catch (err) {
      console.error('Failed to load blog data:', err)
    }
  }

  const loadStoryData = async () => {
    try {
      const url = selectedStoryId
        ? `/api/admin/analytics/story-details.php?days=${days}&story_id=${selectedStoryId}`
        : `/api/admin/analytics/story-details.php?days=${days}`

      const response = await fetch(url, { credentials: 'same-origin' })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setStoryData(result.data)
        }
      }
    } catch (err) {
      console.error('Failed to load story data:', err)
    }
  }

  const loadGalleryData = async () => {
    try {
      const url = selectedGalleryId
        ? `/api/admin/analytics/gallery-details.php?days=${days}&gallery_id=${selectedGalleryId}`
        : `/api/admin/analytics/gallery-details.php?days=${days}`

      const response = await fetch(url, { credentials: 'same-origin' })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setGalleryData(result.data)
        }
      }
    } catch (err) {
      console.error('Failed to load gallery data:', err)
    }
  }

  const loadAnalyticsData = async () => {
    setLoading(true)
    setError('')

    try {
      // Load all analytics data in parallel
      const [summaryResponse, visitorResponse, geographyResponse, activityResponse] = await Promise.all([
        fetch(`/api/admin/analytics/summary.php?days=${days}`, { credentials: 'same-origin' }),
        fetch(`/api/admin/analytics/visitors.php?days=${days}`, { credentials: 'same-origin' }),
        fetch(`/api/admin/analytics/geography.php?days=${days}`, { credentials: 'same-origin' }),
        fetch(`/api/admin/analytics/activity.php?days=${days}`, { credentials: 'same-origin' })
      ])

      if (!summaryResponse.ok) {
        throw new Error('Failed to load summary data')
      }

      const summaryResult = await summaryResponse.json()
      if (summaryResult.success) {
        setSummaryData(summaryResult.data)
      }

      if (visitorResponse.ok) {
        const visitorResult = await visitorResponse.json()
        if (visitorResult.success) {
          setVisitorData(visitorResult.data)
        }
      }

      if (geographyResponse.ok) {
        const geoResult = await geographyResponse.json()
        if (geoResult.success) {
          setGeographyData(geoResult.data)
        }
      }

      if (activityResponse.ok) {
        const activityResult = await activityResponse.json()
        if (activityResult.success) {
          setActivityData(activityResult.data)
        }
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num)
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (minutes === 0) return `${secs}s`
    return `${minutes}m ${secs}s`
  }

  const formatPercentage = (num: number) => {
    return `${num}%`
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <div className="mt-2 text-gray-600 dark:text-gray-400">Loading analytics...</div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="text-red-600 dark:text-red-400">Error: {error}</div>
          <button
            onClick={loadAnalyticsData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4 sm:mb-0">
              Analytics Dashboard
            </h2>

            <div className="flex flex-wrap gap-4">
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
                <option value={365}>Last year</option>
              </select>

              <button
                onClick={loadAnalyticsData}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                Refresh
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-6 border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('visitors')}
                className={`${
                  activeTab === 'visitors'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Visitors
              </button>
              <button
                onClick={() => setActiveTab('geography')}
                className={`${
                  activeTab === 'geography'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Geography
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                className={`${
                  activeTab === 'activity'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Activity
              </button>
              <button
                onClick={() => {
                  setActiveTab('stories')
                  setSelectedStoryId(null)
                }}
                className={`${
                  activeTab === 'stories'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Stories
              </button>
              <button
                onClick={() => {
                  setActiveTab('galleries')
                  setSelectedGalleryId(null)
                }}
                className={`${
                  activeTab === 'galleries'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Galleries
              </button>
              <button
                onClick={() => {
                  setActiveTab('blog')
                  setSelectedBlogPostId(null)
                }}
                className={`${
                  activeTab === 'blog'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Blog
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && summaryData && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard
              title="Total Views"
              value={formatNumber(summaryData.summary.total_views)}
              subtitle={`${summaryData.period_days} days`}
              icon="👁️"
            />
            <StatCard
              title="Unique Visitors"
              value={formatNumber(summaryData.summary.unique_visitors)}
              subtitle={`${summaryData.period_days} days`}
              icon="👥"
            />
            <StatCard
              title="Story Views"
              value={formatNumber(summaryData.summary.story_views)}
              subtitle="Story page visits"
              icon="📚"
            />
            <StatCard
              title="Chapter Views"
              value={formatNumber(summaryData.summary.chapter_views)}
              subtitle="Chapter reads"
              icon="📖"
            />
            <StatCard
              title="Gallery Views"
              value={formatNumber(summaryData.summary.gallery_views)}
              subtitle="Gallery visits"
              icon="🖼️"
            />
            <StatCard
              title="Avg Reading Depth"
              value={formatPercentage(summaryData.summary.avg_reading_depth)}
              subtitle="Chapter completion"
              icon="📊"
            />
          </div>

          {/* Daily Trend Chart */}
          {summaryData.daily_trend.length > 0 && (
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Daily Views Trend
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={summaryData.daily_trend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Top Stories */}
          {summaryData.top_stories.length > 0 && (
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Top Stories ({summaryData.period_days} days)
                </h3>
                <div className="space-y-3">
                  {summaryData.top_stories.slice(0, 10).map((story, index) => (
                    <div key={story.story_slug} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-sm text-gray-500 dark:text-gray-400 w-6">
                          #{index + 1}
                        </span>
                        <span className="text-sm text-gray-900 dark:text-white ml-3">
                          {story.story_slug}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatNumber(story.views)} views
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Visitors Tab */}
      {activeTab === 'visitors' && visitorData && (
        <>
          {/* Visitor Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Unique Visitors"
              value={formatNumber(visitorData.unique_visitors)}
              subtitle="By IP address"
              icon="👤"
            />
            <StatCard
              title="Total Sessions"
              value={formatNumber(visitorData.total_sessions)}
              subtitle="Visit sessions"
              icon="🔄"
            />
            <StatCard
              title="Repeat Visitor Rate"
              value={formatPercentage(visitorData.repeat_visitor_rate)}
              subtitle={`${formatNumber(visitorData.repeat_visitors)} repeat visitors`}
              icon="🔁"
            />
            <StatCard
              title="Avg Session Duration"
              value={formatDuration(visitorData.avg_session_duration)}
              subtitle={`${visitorData.avg_pages_per_session} pages/session`}
              icon="⏱️"
            />
          </div>

          {/* New vs Returning */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  New vs Returning Visitors
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'New Visitors', value: visitorData.new_visitors },
                        { name: 'Returning Visitors', value: visitorData.returning_visitors }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry: any) => `${entry.name}: ${(entry.percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="#3b82f6" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatNumber(visitorData.new_visitors)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">New</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {formatNumber(visitorData.returning_visitors)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Returning</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Daily Visitors Trend */}
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Daily Unique Visitors
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={visitorData.daily_visitors}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="unique_visitors" stroke="#3b82f6" name="Unique Visitors" />
                    <Line type="monotone" dataKey="sessions" stroke="#10b981" name="Sessions" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Geography Tab */}
      {activeTab === 'geography' && geographyData && (
        <>
          {/* Top Countries */}
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Top Countries
              </h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={geographyData.top_countries.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="country_code" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="unique_visitors" fill="#3b82f6" name="Unique Visitors" />
                  <Bar dataKey="sessions" fill="#10b981" name="Sessions" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Countries Table */}
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Country Details
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Rank
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Country
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Unique Visitors
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Sessions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Total Events
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {geographyData.top_countries.map((country, index) => (
                      <tr key={country.country_code}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          #{index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {country.country_code}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {formatNumber(country.unique_visitors)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {formatNumber(country.sessions)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {formatNumber(country.total_events)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Top Cities */}
          {geographyData.top_cities.length > 0 && (
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Top Cities
                </h3>
                <div className="space-y-3">
                  {geographyData.top_cities.slice(0, 15).map((city, index) => (
                    <div key={`${city.city}-${city.country_code}`} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-sm text-gray-500 dark:text-gray-400 w-6">
                          #{index + 1}
                        </span>
                        <span className="text-sm text-gray-900 dark:text-white ml-3">
                          {city.city}, {city.region} ({city.country_code})
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatNumber(city.unique_visitors)} visitors
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {formatNumber(city.sessions)} sessions
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Activity Tab */}
      {activeTab === 'activity' && activityData && (
        <>
          {/* Device & Browser Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Device Types */}
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Device Types
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={activityData.device_breakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry: any) => `${entry.device_type}: ${(entry.percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="unique_visitors"
                      nameKey="device_type"
                    >
                      {activityData.device_breakdown.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Browsers */}
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Browsers
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={activityData.browser_breakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="browser" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="unique_visitors" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Hourly Activity Heatmap */}
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Activity by Hour of Day
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={activityData.hourly_activity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" label={{ value: 'Hour (24h)', position: 'insideBottom', offset: -5 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="unique_visitors" fill="#3b82f6" name="Unique Visitors" />
                  <Bar dataKey="sessions" fill="#10b981" name="Sessions" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Weekly Activity */}
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Activity by Day of Week
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={activityData.weekly_activity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day_name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="unique_visitors" fill="#3b82f6" name="Unique Visitors" />
                  <Bar dataKey="sessions" fill="#10b981" name="Sessions" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Referrers */}
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Top Traffic Sources
              </h3>
              <div className="space-y-3">
                {activityData.referrer_breakdown.slice(0, 10).map((referrer, index) => (
                  <div key={referrer.referrer} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 dark:text-gray-400 w-6">
                        #{index + 1}
                      </span>
                      <span className="text-sm text-gray-900 dark:text-white ml-3 font-mono">
                        {referrer.referrer}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatNumber(referrer.sessions)} sessions
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {formatNumber(referrer.unique_visitors)} visitors
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Visitor Sessions */}
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Recent Visitor Sessions
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        First Seen
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Pages
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Device
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {activityData.recent_sessions.slice(0, 20).map((session) => {
                      const isMobile = session.user_agent.includes('Mobile') || session.user_agent.includes('Android') || session.user_agent.includes('iPhone')
                      const isTablet = session.user_agent.includes('Tablet') || session.user_agent.includes('iPad')
                      const deviceIcon = isMobile ? '📱' : isTablet ? '📱' : '💻'

                      return (
                        <tr key={session.session_id}>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                            <div className="font-medium">{session.country_code}</div>
                            {session.city && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {session.city}, {session.region}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {new Date(session.first_seen).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {formatDuration(session.duration_seconds)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {session.page_views}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {deviceIcon}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Stories Tab */}
      {activeTab === 'stories' && storyData && (
        <>
          {/* Story Selector */}
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 sm:mb-0">
                  {selectedStoryId && storyData.story ? `${storyData.story.title} - Chapter Analytics` : 'Stories Overview'}
                </h3>
                {storyData.stories && storyData.stories.length > 0 && (
                  <select
                    value={selectedStoryId || ''}
                    onChange={(e) => setSelectedStoryId(e.target.value ? Number(e.target.value) : null)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                  >
                    <option value="">All Stories Overview</option>
                    {storyData.stories.map((story) => (
                      <option key={story.id} value={story.id}>
                        {story.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* Show All Stories or Selected Story Chapters */}
          {!selectedStoryId && storyData.stories && (
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  All Stories ({storyData.period_days} days)
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Story
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Likes
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Comments
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Total Views
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Story Views
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Chapter Views
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Unique Readers
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Avg Depth
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Chapters
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {storyData.stories.map((story) => (
                        <tr key={story.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer" onClick={() => setSelectedStoryId(story.id)}>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                            <div>
                              <div className="font-medium">{story.title}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{story.slug}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {formatNumber(story.total_likes)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {formatNumber(story.total_comments)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {formatNumber(story.total_views)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {formatNumber(story.story_views)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {formatNumber(story.chapter_views)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {formatNumber(story.unique_readers)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {story.avg_reading_depth}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {formatNumber(story.total_chapters)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Chapter Details for Selected Story */}
          {selectedStoryId && storyData.chapters && (
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Chapters ({storyData.period_days} days)
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Chapter
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Likes
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Comments
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Views
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Unique Readers
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Avg Depth
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Avg Time
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {storyData.chapters.map((chapter) => (
                        <tr key={chapter.id}>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                            <div>
                              <div className="font-medium">
                                Ch. {chapter.chapter_number}: {chapter.title}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{chapter.chapter_slug}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {formatNumber(chapter.likes)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {formatNumber(chapter.comments)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {formatNumber(chapter.views)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {formatNumber(chapter.unique_readers)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {chapter.avg_reading_depth}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {Math.round(chapter.avg_time_spent)}s
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Galleries Tab */}
      {activeTab === 'galleries' && galleryData && (
        <>
          {/* Gallery Selector */}
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 sm:mb-0">
                  {selectedGalleryId && galleryData.gallery ? `${galleryData.gallery.title} - Image Analytics` : 'Galleries Overview'}
                </h3>
                {galleryData.galleries && galleryData.galleries.length > 0 && (
                  <select
                    value={selectedGalleryId || ''}
                    onChange={(e) => setSelectedGalleryId(e.target.value ? Number(e.target.value) : null)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                  >
                    <option value="">All Galleries Overview</option>
                    {galleryData.galleries.map((gallery) => (
                      <option key={gallery.id} value={gallery.id}>
                        {gallery.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* Show All Galleries or Selected Gallery Images */}
          {!selectedGalleryId && galleryData.galleries && (
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  All Galleries ({galleryData.period_days} days)
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Gallery
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Likes
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Comments
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Total Views
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Gallery Views
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Image Views
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Unique Visitors
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Images
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {galleryData.galleries.map((gallery) => (
                        <tr key={gallery.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer" onClick={() => setSelectedGalleryId(gallery.id)}>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                            <div>
                              <div className="font-medium">{gallery.title}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{gallery.slug}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {formatNumber(gallery.total_likes)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {formatNumber(gallery.total_comments)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {formatNumber(gallery.total_views)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {formatNumber(gallery.gallery_views)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {formatNumber(gallery.image_views)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {formatNumber(gallery.unique_visitors)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {formatNumber(gallery.total_images)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Image Details for Selected Gallery */}
          {selectedGalleryId && galleryData.images && (
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Images ({galleryData.period_days} days)
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Image
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Likes
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Comments
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Views
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Unique Viewers
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {galleryData.images.map((image, index) => (
                        <tr key={image.id}>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                            <div>
                              <div className="font-medium">
                                #{index + 1} {image.title || image.filename}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{image.filename}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {formatNumber(image.likes)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {formatNumber(image.comments)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {formatNumber(image.views)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {formatNumber(image.unique_viewers)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Blog Tab */}
      {activeTab === 'blog' && blogData && (
        <>
          {/* Blog Summary Cards */}
          {!selectedBlogPostId && blogData.summary && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Views"
                value={formatNumber(blogData.summary.total_views || 0)}
                subtitle={`${blogData.period_days} days`}
                icon="👁️"
              />
              <StatCard
                title="Total Likes"
                value={formatNumber(blogData.summary.total_likes || 0)}
                subtitle="Reader engagement"
                icon="❤️"
              />
              <StatCard
                title="Unique Visitors"
                value={formatNumber(blogData.summary.unique_visitors || 0)}
                subtitle="Unique readers"
                icon="👥"
              />
              <StatCard
                title="Published Posts"
                value={formatNumber(blogData.summary.published_count || 0)}
                subtitle={`${blogData.summary.draft_count || 0} drafts, ${blogData.summary.scheduled_count || 0} scheduled`}
                icon="📝"
              />
            </div>
          )}

          {/* Blog Post Selector */}
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 sm:mb-0">
                  {selectedBlogPostId && blogData.post ? `${blogData.post.title} - Analytics` : 'Blog Posts Overview'}
                </h3>
                {blogData.posts && blogData.posts.length > 0 && (
                  <select
                    value={selectedBlogPostId || ''}
                    onChange={(e) => setSelectedBlogPostId(e.target.value ? Number(e.target.value) : null)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                  >
                    <option value="">All Posts Overview</option>
                    {blogData.posts.map((post) => (
                      <option key={post.id} value={post.id}>
                        {post.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* Daily Trend Chart */}
          {!selectedBlogPostId && blogData.daily_trend && blogData.daily_trend.length > 0 && (
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Daily Blog Views
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={blogData.daily_trend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="views" stroke="#3b82f6" name="Views" strokeWidth={2} />
                    <Line type="monotone" dataKey="likes" stroke="#ef4444" name="Likes" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* All Blog Posts Table */}
          {!selectedBlogPostId && blogData.posts && (
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  All Blog Posts ({blogData.period_days} days)
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Post
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Period Views
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Period Likes
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Unique Visitors
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Total Views
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Total Likes
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {blogData.posts.map((post) => (
                        <tr key={post.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer" onClick={() => setSelectedBlogPostId(post.id)}>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                            <div>
                              <div className="font-medium">{post.title}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{post.slug}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              post.status === 'published' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : post.status === 'scheduled'
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                            }`}>
                              {post.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {formatNumber(post.period_views)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {formatNumber(post.period_likes)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {formatNumber(post.unique_visitors)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {formatNumber(post.view_count)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {formatNumber(post.like_count)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Selected Post Details */}
          {selectedBlogPostId && blogData.post && (
            <>
              {/* Post Stats */}
              {blogData.totals && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard
                    title="Period Views"
                    value={formatNumber(blogData.totals.total_views || 0)}
                    subtitle={`Last ${blogData.period_days} days`}
                    icon="👁️"
                  />
                  <StatCard
                    title="Period Likes"
                    value={formatNumber(blogData.totals.total_likes || 0)}
                    subtitle={`Last ${blogData.period_days} days`}
                    icon="❤️"
                  />
                  <StatCard
                    title="Shares"
                    value={formatNumber(blogData.totals.total_shares || 0)}
                    subtitle="Social shares"
                    icon="📤"
                  />
                  <StatCard
                    title="Unique Visitors"
                    value={formatNumber(blogData.totals.unique_visitors || 0)}
                    subtitle="Unique readers"
                    icon="👥"
                  />
                </div>
              )}

              {/* Daily Stats Chart */}
              {blogData.daily_stats && blogData.daily_stats.length > 0 && (
                <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Daily Views & Likes
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={blogData.daily_stats}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="views" stroke="#3b82f6" name="Views" strokeWidth={2} />
                        <Line type="monotone" dataKey="likes" stroke="#ef4444" name="Likes" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Traffic Sources */}
              {blogData.referrers && blogData.referrers.length > 0 && (
                <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Traffic Sources
                    </h3>
                    <div className="space-y-3">
                      {blogData.referrers.map((referrer, index) => (
                        <div key={referrer.source} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <span className="text-sm text-gray-500 dark:text-gray-400 w-6">
                              #{index + 1}
                            </span>
                            <span className="text-sm text-gray-900 dark:text-white ml-3">
                              {referrer.source}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {formatNumber(referrer.count)} views
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {formatNumber(referrer.unique_visitors)} visitors
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Geographic Breakdown */}
              {blogData.countries && blogData.countries.length > 0 && (
                <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Top Countries
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={blogData.countries.slice(0, 10)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="country_code" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="views" fill="#3b82f6" name="Views" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}

function StatCard({ title, value, subtitle, icon }: {
  title: string
  value: string
  subtitle: string
  icon: string
}) {
  return (
    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <span className="text-2xl">{icon}</span>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                {title}
              </dt>
              <dd className="text-lg font-medium text-gray-900 dark:text-white">
                {value}
              </dd>
              <dd className="text-sm text-gray-500 dark:text-gray-400">
                {subtitle}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
