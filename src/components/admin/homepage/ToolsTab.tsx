import { useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd'

interface Tool {
  id: number
  title: string
  description: string
  icon: string
  link: string
  display_order: number
  is_active: boolean
}

const emptyTool: Omit<Tool, 'id'> = {
  title: '',
  description: '',
  icon: '🔧',
  link: '',
  display_order: 0,
  is_active: true
}

export default function ToolsTab() {
  const [tools, setTools] = useState<Tool[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<Tool | null>(null)
  const [formData, setFormData] = useState(emptyTool)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadTools()
  }, [])

  const loadTools = async () => {
    try {
      const response = await fetch('/api/homepage/tools.php')
      const data = await response.json()
      if (data.success) {
        setTools(data.tools || [])
      }
    } catch (err) {
      setError('Failed to load tools')
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = () => {
    setEditingItem(null)
    setFormData({ ...emptyTool, display_order: tools.length })
    setShowModal(true)
  }

  const openEditModal = (item: Tool) => {
    setEditingItem(item)
    setFormData({
      title: item.title,
      description: item.description || '',
      icon: item.icon || '🔧',
      link: item.link || '',
      display_order: item.display_order,
      is_active: item.is_active
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingItem(null)
    setFormData(emptyTool)
  }

  const handleSave = async () => {
    if (!formData.title.trim()) {
      setError('Title is required')
      return
    }

    setSaving(true)
    setError('')

    try {
      const method = editingItem ? 'PUT' : 'POST'
      const body = editingItem ? { ...formData, id: editingItem.id } : formData

      const response = await fetch('/api/homepage/tools.php', {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(editingItem ? 'Tool updated!' : 'Tool created!')
        setTimeout(() => setSuccess(''), 3000)
        closeModal()
        loadTools()
      } else {
        setError(data.error || 'Failed to save tool')
      }
    } catch (err) {
      setError('Network error occurred')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this tool?')) return

    try {
      const response = await fetch('/api/homepage/tools.php', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ id }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('Tool deleted!')
        setTimeout(() => setSuccess(''), 3000)
        loadTools()
      } else {
        setError(data.error || 'Failed to delete tool')
      }
    } catch (err) {
      setError('Network error occurred')
    }
  }

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return

    const items = Array.from(tools)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Update display_order for all items
    const updatedItems = items.map((item, index) => ({
      ...item,
      display_order: index
    }))

    setTools(updatedItems)

    // Save the reordered item's new position
    try {
      const movedItem = updatedItems[result.destination.index]
      await fetch('/api/homepage/tools.php', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          id: movedItem.id,
          title: movedItem.title,
          description: movedItem.description,
          icon: movedItem.icon,
          link: movedItem.link,
          display_order: movedItem.display_order,
          is_active: movedItem.is_active
        }),
      })
    } catch (err) {
      setError('Failed to save order')
      loadTools() // Reload on error
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">Homepage Tools</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Drag to reorder • Manage tools section</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          + Add Tool
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

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="tools">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
              {tools.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  No tools yet. Add your first tool!
                </div>
              ) : (
                tools.map((tool, index) => (
                  <Draggable key={tool.id} draggableId={String(tool.id)} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`flex items-center gap-4 p-4 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg ${
                          snapshot.isDragging ? 'shadow-lg' : ''
                        }`}
                      >
                        <div
                          {...provided.dragHandleProps}
                          className="cursor-grab text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          ⋮⋮
                        </div>
                        <span className="text-2xl">{tool.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 dark:text-white">{tool.title}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate">{tool.description}</div>
                          {tool.link && (
                            <div className="text-xs text-blue-600 dark:text-blue-400 truncate">{tool.link}</div>
                          )}
                        </div>
                        <span className={`px-2 py-1 text-xs rounded ${
                          tool.is_active 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-400'
                        }`}>
                          {tool.is_active ? 'Active' : 'Hidden'}
                        </span>
                        <div className="flex gap-2">
                          <button onClick={() => openEditModal(tool)} className="text-blue-600 hover:text-blue-800 text-sm">
                            Edit
                          </button>
                          <button onClick={() => handleDelete(tool.id)} className="text-red-600 hover:text-red-800 text-sm">
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={closeModal}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {editingItem ? 'Edit Tool' : 'Add Tool'}
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Icon</label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full px-3 py-2 text-2xl text-center border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                    placeholder="🔧"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                    placeholder="LitRPG Tools"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  placeholder="Brief description..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Link</label>
                <input
                  type="text"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  placeholder="/litrpg or https://..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700 dark:text-gray-300">Active (visible on homepage)</label>
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
