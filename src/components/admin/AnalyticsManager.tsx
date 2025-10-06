import { useState, useEffect } from 'react'

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

interface SegmentData {
  segment: string
  views: number
  unique_visitors: number
}

interface ContentItem {
  [key: string]: any
}

export default function AnalyticsManager() {
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null)
  const [segmentData, setSegmentData] = useState<SegmentData[]>([])
  const [contentData, setContentData] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Filters
  const [days, setDays] = useState(30)
  const [segmentType, setSegmentType] = useState('device')
  const [contentType, setContentType] = useState('stories')

  useEffect(() => {
    loadAnalyticsData()
  }, [days, segmentType, contentType])

  const loadAnalyticsData = async () => {
    setLoading(true)
    setError('')
    
    try {
      // Load summary data
      const summaryResponse = await fetch(`/api/admin/analytics/summary.php?days=${days}`, {
        credentials: 'same-origin'
      })
      
      if (!summaryResponse.ok) {
        throw new Error('Failed to load summary data')
      }
      
      const summaryResult = await summaryResponse.json()
      if (summaryResult.success) {
        setSummaryData(summaryResult.data)
      }
      
      // Load segment data
      const segmentResponse = await fetch(`/api/admin/analytics/segment.php?days=${days}&segment=${segmentType}`, {
        credentials: 'same-origin'
      })
      
      if (segmentResponse.ok) {
        const segmentResult = await segmentResponse.json()
        if (segmentResult.success) {
          setSegmentData(segmentResult.data.segments)
        }
      }
      
      // Load content data
      const contentResponse = await fetch(`/api/admin/analytics/content.php?days=${days}&type=${contentType}`, {
        credentials: 'same-origin'
      })
      
      if (contentResponse.ok) {
        const contentResult = await contentResponse.json()
        if (contentResult.success) {
          setContentData(contentResult.data.content)
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

  const formatPercentage = (num: number) => {
    return `${num}%`
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="text-center">Loading analytics...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="text-red-600 dark:text-red-400">Error: {error}</div>
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
        </div>
      </div>

      {/* Summary Cards */}
      {summaryData && (
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
      )}

      {/* Top Stories */}
      {summaryData && summaryData.top_stories.length > 0 && (
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

      {/* Segment Analysis */}
      <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Audience Segments
            </h3>
            <select
              value={segmentType}
              onChange={(e) => setSegmentType(e.target.value)}
              className="mt-2 sm:mt-0 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
            >
              <option value="device">Device Type</option>
              <option value="browser">Browser</option>
              <option value="referrer">Referrer</option>
              <option value="hour">Hour of Day</option>
              <option value="day_of_week">Day of Week</option>
              <option value="content_type">Content Type</option>
            </select>
          </div>
          
          <div className="space-y-3">
            {segmentData.slice(0, 10).map((segment, index) => (
              <div key={segment.segment} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400 w-6">
                    #{index + 1}
                  </span>
                  <span className="text-sm text-gray-900 dark:text-white ml-3">
                    {segment.segment}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatNumber(segment.views)} views
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {formatNumber(segment.unique_visitors)} unique
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content Performance */}
      <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Content Performance
            </h3>
            <select
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
              className="mt-2 sm:mt-0 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
            >
              <option value="stories">Stories</option>
              <option value="chapters">Chapters</option>
              <option value="galleries">Galleries</option>
              <option value="pages">Pages</option>
            </select>
          </div>
          
          <div className="overflow-x-auto">
            <ContentTable contentType={contentType} data={contentData} />
          </div>
        </div>
      </div>
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

function ContentTable({ contentType, data }: {
  contentType: string
  data: ContentItem[]
}) {
  const formatNumber = (num: number) => new Intl.NumberFormat().format(num)

  if (contentType === 'stories') {
    return (
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Story
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Total Views
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
          {data.slice(0, 20).map((story) => (
            <tr key={story.slug}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                <div>
                  <div className="font-medium">{story.title}</div>
                  <div className="text-gray-500 dark:text-gray-400">{story.slug}</div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {formatNumber(story.total_views)}
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
    )
  }

  if (contentType === 'chapters') {
    return (
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Chapter
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
          {data.slice(0, 20).map((chapter) => (
            <tr key={chapter.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                <div>
                  <div className="font-medium">
                    Ch. {chapter.chapter_number}: {chapter.title}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400">{chapter.story_title}</div>
                </div>
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
    )
  }

  if (contentType === 'galleries') {
    return (
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Gallery
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Total Views
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
          {data.slice(0, 20).map((gallery) => (
            <tr key={gallery.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                <div>
                  <div className="font-medium">{gallery.title}</div>
                  <div className="text-gray-500 dark:text-gray-400">{gallery.slug}</div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {formatNumber(gallery.total_views)}
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
    )
  }

  if (contentType === 'pages') {
    return (
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Page
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Views
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Unique Visitors
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Avg Time
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {data.slice(0, 20).map((page, index) => (
            <tr key={index}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                <div>
                  <div className="font-medium">{page.page_title || 'Untitled'}</div>
                  <div className="text-gray-500 dark:text-gray-400">{page.page_path}</div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {formatNumber(page.views)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {formatNumber(page.unique_visitors)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {Math.round(page.avg_time_on_page)}s
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  return <div>No data available</div>
}
