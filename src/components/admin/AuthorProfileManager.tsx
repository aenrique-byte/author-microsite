import { useState, useEffect } from 'react'

interface AuthorProfile {
  name: string
  bio: string
  tagline: string
  profile_image?: string
  background_image_light?: string
  background_image_dark?: string
  site_domain?: string
}

export default function AuthorProfileManager() {
  const [profile, setProfile] = useState<AuthorProfile>({
    name: '',
    bio: '',
    tagline: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const response = await fetch('/api/author/get.php')
      const data = await response.json()
      
      if (data.success) {
        setProfile(data.profile)
      }
    } catch (err) {
      setError('Failed to load author profile')
    } finally {
      setLoading(false)
    }
  }

  const saveProfile = async () => {
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/author/update.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify(profile),
      })

      const data = await response.json()
      
      if (data.success) {
        setSuccess('Profile updated successfully!')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.error || 'Failed to update profile')
      }
    } catch (err) {
      setError('Network error occurred')
    } finally {
      setSaving(false)
    }
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
        <h2 className="text-lg font-medium text-gray-900">Author Profile</h2>
        <p className="text-sm text-gray-600">
          Manage your author information displayed on the homepage
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

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Name
          </label>
          <input
            type="text"
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Your author name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bio
          </label>
          <input
            type="text"
            value={profile.bio}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Author & Writer"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tagline
          </label>
          <input
            type="text"
            value={profile.tagline}
            onChange={(e) => setProfile({ ...profile, tagline: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Stories that captivate and inspire"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Profile Image URL (optional)
          </label>
          <input
            type="url"
            value={profile.profile_image || ''}
            onChange={(e) => setProfile({ ...profile, profile_image: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://example.com/profile.jpg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Light Theme Background Image URL (optional)
          </label>
          <input
            type="url"
            value={profile.background_image_light || ''}
            onChange={(e) => setProfile({ ...profile, background_image_light: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://example.com/light-background.jpg"
          />
          <p className="text-xs text-gray-500 mt-1">
            Leave empty to use default: /images/lofi_light_bg.webp
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dark Theme Background Image URL (optional)
          </label>
          <input
            type="url"
            value={profile.background_image_dark || ''}
            onChange={(e) => setProfile({ ...profile, background_image_dark: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://example.com/dark-background.jpg"
          />
          <p className="text-xs text-gray-500 mt-1">
            Leave empty to use default: /images/lofi_bg.webp
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Site Domain (for SEO)
          </label>
          <input
            type="text"
            value={profile.site_domain || ''}
            onChange={(e) => setProfile({ ...profile, site_domain: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="example.com"
          />
          <p className="text-xs text-gray-500 mt-1">
            Domain name used for SEO URLs and canonical links. Leave empty to use server detection.
          </p>
        </div>

        <div className="pt-4">
          <button
            onClick={saveProfile}
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Preview</h3>
        <div className="text-sm text-gray-600">
          <div className="font-semibold">{profile.name || 'Your Name'}</div>
          <div>{profile.bio || 'Your Bio'} | {profile.tagline || 'Your Tagline'}</div>
        </div>
      </div>
    </div>
  )
}
