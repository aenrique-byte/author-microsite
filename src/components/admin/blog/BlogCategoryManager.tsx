import { useState, useEffect } from 'react'
import { Plus, Trash2, Tag, AlertCircle } from 'lucide-react'
import { 
  listBlogCategories, 
  createBlogCategory, 
  deleteBlogCategory 
} from '../../../utils/api-blog'
import type { BlogCategory } from '../../../types/blog'

interface BlogCategoryManagerProps {
  onCategoriesChange?: () => void
}

export function BlogCategoryManager({ onCategoriesChange }: BlogCategoryManagerProps) {
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  // Fetch categories
  const fetchCategories = async () => {
    setLoading(true)
    try {
      const result = await listBlogCategories(true)
      if (result.success) {
        setCategories(result.categories)
      } else {
        setError(result.error || 'Failed to load categories')
      }
    } catch (err) {
      setError('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  // Create category
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCategoryName.trim() || creating) return

    setCreating(true)
    setError(null)

    try {
      const result = await createBlogCategory(newCategoryName.trim())
      if (result.success) {
        setNewCategoryName('')
        fetchCategories()
        onCategoriesChange?.()
      } else {
        setError(result.error || 'Failed to create category')
      }
    } catch (err) {
      setError('Failed to create category')
    } finally {
      setCreating(false)
    }
  }

  // Delete category
  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete category "${name}"? This won't remove it from existing posts.`)) return

    setDeletingId(id)
    setError(null)

    try {
      const result = await deleteBlogCategory(id)
      if (result.success) {
        fetchCategories()
        onCategoriesChange?.()
      } else {
        setError(result.error || 'Failed to delete category')
      }
    } catch (err) {
      setError('Failed to delete category')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-gray-200 dark:border-neutral-700">
      <div className="flex items-center gap-2 mb-4">
        <Tag className="w-5 h-5 text-emerald-500" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Categories
        </h3>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Add Category Form */}
      <form onSubmit={handleCreate} className="flex gap-2 mb-4">
        <input
          type="text"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          placeholder="New category name..."
          maxLength={100}
          className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
        />
        <button
          type="submit"
          disabled={creating || !newCategoryName.trim()}
          className="px-4 py-2 rounded-lg bg-emerald-500 text-white font-medium text-sm hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {creating ? 'Adding...' : 'Add'}
        </button>
      </form>

      {/* Categories List */}
      {loading ? (
        <div className="text-center py-4 text-gray-500 dark:text-neutral-400">
          Loading categories...
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-4 text-gray-500 dark:text-neutral-400">
          No categories yet. Create one above!
        </div>
      ) : (
        <ul className="space-y-2">
          {categories.map((category) => (
            <li 
              key={category.id}
              className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700"
            >
              <div className="flex items-center gap-3">
                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-emerald-500 text-white uppercase">
                  {category.name}
                </span>
                <span className="text-xs text-gray-500 dark:text-neutral-400">
                  {category.post_count || 0} post{category.post_count !== 1 ? 's' : ''}
                </span>
              </div>
              <button
                onClick={() => handleDelete(category.id, category.name)}
                disabled={deletingId === category.id}
                className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                title="Delete category"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-4 text-xs text-gray-500 dark:text-neutral-400">
        Note: Deleting a category won't remove it from existing posts. Posts will keep the category name.
      </p>
    </div>
  )
}

export default BlogCategoryManager
