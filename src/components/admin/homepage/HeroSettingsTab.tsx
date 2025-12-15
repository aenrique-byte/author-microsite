import { useState, useEffect } from 'react'

interface HomepageSettings {
  id: number | null
  hero_title: string
  hero_tagline: string
  hero_description: string
  featured_story_id: number | null
  show_featured_story: boolean
  show_activity_feed: boolean
  show_tools_section: boolean
  newsletter_cta_text: string
  newsletter_url: string
  brand_color: string
  brand_color_dark: string
}

interface Story {
  id: number
  title: string
  status: string
  display_order?: number
}

const defaultSettings: HomepageSettings = {
  id: null,
  hero_title: 'Step into the worlds of',
  hero_tagline: 'Shared Multiverse Portal',
  hero_description: 'Starships, sky-pirates, cursed knights, and reluctant warlocks.',
  featured_story_id: null,
  show_featured_story: true,
  show_activity_feed: true,
  show_tools_section: true,
  newsletter_cta_text: 'Join the Newsletter',
  newsletter_url: '',
  brand_color: '#10b981',
  brand_color_dark: '#10b981'
}

export default function HeroSettingsTab() {
  const [settings, setSettings] = useState<HomepageSettings>(defaultSettings)
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [settingsRes, storiesRes] = await Promise.all([
        fetch('/api/homepage/settings.php'),
        fetch('/api/stories/list.php')
      ])
      
      const settingsData = await settingsRes.json()
      const storiesData = await storiesRes.json()
      
      if (settingsData.success && settingsData.settings) {
        setSettings({ ...defaultSettings, ...settingsData.settings })
      }
      
      if (storiesData.success && storiesData.stories) {
        const published = storiesData.stories
          .filter((s: Story) => s.status === 'published')
          .sort((a: Story, b: Story) => 
            (a.display_order ?? 999) - (b.display_order ?? 999)
          )
        setStories(published)
      }
    } catch (err) {
      setError('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const validateSettings = (): string[] => {
    const errors: string[] = []
    if (!settings.hero_title?.trim()) errors.push('Hero title is required')
    if (!settings.hero_tagline?.trim()) errors.push('Hero tagline is required')
    if (!settings.newsletter_cta_text?.trim()) errors.push('Newsletter CTA text is required')
    if (!settings.brand_color?.trim()) errors.push('Brand color (light) is required')
    if (!settings.brand_color_dark?.trim()) errors.push('Brand color (dark) is required')

    const hexRegex = /^#(?:[0-9a-fA-F]{3}){1,2}$/
    if (settings.brand_color && !hexRegex.test(settings.brand_color)) {
      errors.push('Brand color (light) must be a valid hex (e.g., #10b981)')
    }
    if (settings.brand_color_dark && !hexRegex.test(settings.brand_color_dark)) {
      errors.push('Brand color (dark) must be a valid hex (e.g., #10b981)')
    }

    const urlRegex = /^https?:\/\/.+/i
    if (settings.newsletter_url && !urlRegex.test(settings.newsletter_url)) {
      errors.push('Newsletter URL must start with http:// or https://')
    }

    return errors
  }

  const saveSettings = async () => {
    const errors = validateSettings()
    if (errors.length > 0) {
      setError(errors.join('. '))
      return
    }
    
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/homepage/settings.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(settings),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('Settings saved successfully!')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.error || 'Failed to save settings')
      }
    } catch (err) {
      setError('Network error occurred')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">Hero Settings</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">Configure the homepage hero section</p>
      </div>

      {error && (
        <div className="p-3 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-100 dark:bg-green-900/20 border border-green-400 dark:border-green-800 text-green-700 dark:text-green-400 rounded">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Hero Title *
          </label>
          <input
            type="text"
            value={settings.hero_title}
            onChange={(e) => setSettings({ ...settings, hero_title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Step into the worlds of"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Hero Tagline *
          </label>
          <input
            type="text"
            value={settings.hero_tagline}
            onChange={(e) => setSettings({ ...settings, hero_tagline: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Shared Multiverse Portal"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Hero Description
        </label>
        <textarea
          value={settings.hero_description}
          onChange={(e) => setSettings({ ...settings, hero_description: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          placeholder="Describe your shared universe..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Featured Story
          </label>
          <select
            value={settings.featured_story_id ?? ''}
            onChange={(e) => setSettings({ ...settings, featured_story_id: e.target.value ? Number(e.target.value) : null })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Auto-select first story</option>
            {stories.map((story) => (
              <option key={story.id} value={story.id}>{story.title}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Brand Color (Light Theme) *
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              value={settings.brand_color}
              onChange={(e) => setSettings({ ...settings, brand_color: e.target.value })}
              className="h-10 w-16 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
            />
            <input
              type="text"
              value={settings.brand_color}
              onChange={(e) => setSettings({ ...settings, brand_color: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="#10b981"
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Used for buttons, links, and accents in light mode</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Brand Color (Dark Theme) *
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              value={settings.brand_color_dark}
              onChange={(e) => setSettings({ ...settings, brand_color_dark: e.target.value })}
              className="h-10 w-16 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
            />
            <input
              type="text"
              value={settings.brand_color_dark}
              onChange={(e) => setSettings({ ...settings, brand_color_dark: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="#10b981"
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Used for buttons, links, and accents in dark mode</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Newsletter CTA Text *
          </label>
          <input
            type="text"
            value={settings.newsletter_cta_text}
            onChange={(e) => setSettings({ ...settings, newsletter_cta_text: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Join the Newsletter"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Newsletter URL
          </label>
          <input
            type="url"
            value={settings.newsletter_url}
            onChange={(e) => setSettings({ ...settings, newsletter_url: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="https://..."
          />
        </div>
      </div>

      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-4">
        <h4 className="font-medium text-gray-900 dark:text-white">Section Visibility</h4>
        
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.show_featured_story}
            onChange={(e) => setSettings({ ...settings, show_featured_story: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Show Featured Story Card</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.show_activity_feed}
            onChange={(e) => setSettings({ ...settings, show_activity_feed: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Show Activity Feed Section</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.show_tools_section}
            onChange={(e) => setSettings({ ...settings, show_tools_section: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Show Tools Section</span>
        </label>
      </div>

      <div className="pt-4">
        <button
          onClick={saveSettings}
          disabled={saving}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}
