import { useState, useEffect } from 'react'

interface ActivityItem {
  id: number
  type: 'blog' | 'chapter' | 'announcement' | 'misc'
  source: string
  label: string
  title: string
  series_title: string
  url: string
  published_at: string
  is_active: boolean
}

const emptyActivity: Omit<ActivityItem, 'id'> = {
  type: 'misc',
  source: '',
  label: '',
  title: '',
  series_title: '',
  url: '',
  published_at: new Date().toISOString().slice(0, 16),
  is_active: true
}

export default function ActivityFeedTab() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<ActivityItem | null>(null)
  const [formData, setFormData] = useState(emptyActivity)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadActivities()
  }, [])

  const loadActivities = async () => {
    try {
      const response = await fetch('/api/homepage/activity.php')
      const data = await response.json()
      if (data.success) {
        setActivities(data.activities || [])
      }
    } catch (err) {
      setError('Failed to load activities')
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = () => {
    setEditingItem(null)
    setFormData({ ...emptyActivity, published_at: new Date().toISOString().slice(0, 16) })
    setShowModal(true)
  }

  const openEditModal = (item: ActivityItem) => {
    setEditingItem(item)
    setFormData({
      type: item.type,
      source: item.source,
      label: item.label || '',
      title: item.title,
      series_title: item.series_title || '',
      url: item.url || '',
      published_at: item.published_at?.slice(0, 16) || '',
      is_active: item.is_active
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingItem(null)
    setFormData(emptyActivity)
  }

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.source.trim()) {
      setError('Title and Source are required')
      return
    }

    setSaving(true)
    setError('')

    try {
      const method = editingItem ? 'PUT' : 'POST'
      const body = editingItem ? { ...formData, id: editingItem.id } : formData

      const response = await fetch('/api/homepage/activity.php', {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(editingItem ? 'Activity updated!' : 'Activity created!')
        setTimeout(() => setSuccess(''), 3000)
        closeModal()
        loadActivities()
      } else {
        setError(data.error || 'Failed to save activity')
      }
    } catch (err) {
      setError('Network error occurred')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this activity item?')) return

    try {
      const response = await fetch('/api/homepage/activity.php', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ id }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('Activity deleted!')
        setTimeout(() => setSuccess(''), 3000)
        loadActivities()
      } else {
        setError(data.error || 'Failed to delete activity')
      }
    } catch (err) {
      setError('Network error occurred')
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    })
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">Activity Feed</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage homepage activity updates</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          + Add Activity
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-100 dark:bg-red-900/20 border border-red-400 text-red-700 dark:text-red-400 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-100 dark:bg-green-900/20 border border-green-400 text-green-700 dark:text-green-400 rounded">
          {success}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Source</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Title</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {activities.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  No activity items yet. Add your first update!
                </td>
              </tr>
            ) : (
              activities.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white capitalize">{item.type}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{item.source}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white truncate max-w-xs">{item.title}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{formatDate(item.published_at)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded ${item.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
                      {item.is_active ? 'Active' : 'Hidden'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => openEditModal(item)} className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
                    <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={closeModal}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {editingItem ? 'Edit Activity' : 'Add Activity'}
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as ActivityItem['type'] })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  >
                    <option value="chapter">Chapter</option>
                    <option value="blog">Blog</option>
                    <option value="announcement">Announcement</option>
                    <option value="misc">Misc</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Source *</label>
                  <input
                    type="text"
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                    placeholder="RoyalRoad, Patreon, Blog..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  placeholder="Chapter 142 – Signal in the Void"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Label</label>
                  <input
                    type="text"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                    placeholder="New Chapter"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Series</label>
                  <input
                    type="text"
                    value={formData.series_title}
                    onChange={(e) => setFormData({ ...formData, series_title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                    placeholder="Destiny Among the Stars"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  placeholder="https://..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Published At</label>
                  <input
                    type="datetime-local"
                    value={formData.published_at}
                    onChange={(e) => setFormData({ ...formData, published_at: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={closeModal} className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Saving...' : (editingItem ? 'Update' : 'Create')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
