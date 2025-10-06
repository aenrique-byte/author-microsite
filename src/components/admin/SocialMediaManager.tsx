import { useState, useEffect } from 'react'
import { PLATFORMS, LABELS, PLACEHOLDERS } from '../socials.config'

interface Socials {
  [key: string]: string
}

export default function SocialMediaManager() {
  const [socials, setSocials] = useState<Socials>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const socialPlatforms = PLATFORMS.map(key => ({
    key,
    label: LABELS[key],
    placeholder: PLACEHOLDERS[key]
  }))

  useEffect(() => {
    loadSocials()
  }, [])

  const loadSocials = async () => {
    try {
      const response = await fetch('/api/socials/get.php')
      const data = await response.json()
      
      if (data.success) {
        setSocials(data.socials || {})
      }
    } catch (err) {
      setError('Failed to load social media links')
    } finally {
      setLoading(false)
    }
  }

  const saveSocials = async () => {
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/socials/update.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify(socials),
      })

      const data = await response.json()
      
      if (data.success) {
        setSuccess('Social media links updated successfully!')
        setTimeout(() => setSuccess(''), 3000)
        // Reload to get normalized data
        await loadSocials()
      } else {
        setError(data.error || 'Failed to update social media links')
      }
    } catch (err) {
      setError('Network error occurred')
    } finally {
      setSaving(false)
    }
  }

  const updateSocial = (key: string, value: string) => {
    setSocials(prev => ({
      ...prev,
      [key]: value
    }))
  }

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900">Social Media Links</h2>
        <p className="text-sm text-gray-600">
          Manage social media links displayed across all sites
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {socialPlatforms.map(platform => (
          <div key={platform.key}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {platform.label}
            </label>
            <input
              type="url"
              value={socials[platform.key] || ''}
              onChange={(e) => updateSocial(platform.key, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={platform.placeholder}
            />
          </div>
        ))}
      </div>

      <div className="mt-8 pt-4 border-t border-gray-200">
        <button
          onClick={saveSocials}
          disabled={saving}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Social Links'}
        </button>
      </div>

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Active Links</h3>
        <div className="space-y-2">
          {Object.entries(socials).filter(([_, url]) => url).map(([platform, url]) => (
            <div key={platform} className="flex items-center justify-between text-sm">
              <span className="font-medium capitalize">{platform}:</span>
              <a 
                href={url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 truncate max-w-xs"
              >
                {url}
              </a>
            </div>
          ))}
          {Object.keys(socials).filter(key => socials[key]).length === 0 && (
            <p className="text-gray-500 text-sm">No social links configured yet.</p>
          )}
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-sm font-medium text-blue-900 mb-2">📝 Note</h3>
        <p className="text-sm text-blue-800">
          These social media links will appear on all sites: the author homepage, image galleries, and story pages. 
          Leave fields empty to hide specific platforms.
        </p>
      </div>
    </div>
  )
}
