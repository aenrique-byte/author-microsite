import { useState, useCallback } from 'react'

interface BlogSearchProps {
  initialQuery?: string
  onSearch: (query: string) => void
  theme: 'light' | 'dark'
  placeholder?: string
}

export function BlogSearch({ 
  initialQuery = '', 
  onSearch, 
  theme,
  placeholder = 'Search posts...'
}: BlogSearchProps) {
  const [query, setQuery] = useState(initialQuery)

  const inputBg = theme === 'light' 
    ? 'bg-white/80 border-gray-300 focus:border-emerald-500' 
    : 'bg-white/10 border-white/20 focus:border-emerald-500'
  const textColor = theme === 'light' ? 'text-gray-900' : 'text-white'
  const placeholderColor = theme === 'light' ? 'placeholder:text-gray-400' : 'placeholder:text-neutral-400'

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    onSearch(query.trim())
  }, [query, onSearch])

  const handleClear = useCallback(() => {
    setQuery('')
    onSearch('')
  }, [onSearch])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClear()
    }
  }, [handleClear])

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="relative">
        {/* Search Icon */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg 
            className={`w-5 h-5 ${theme === 'light' ? 'text-gray-400' : 'text-neutral-400'}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
            />
          </svg>
        </div>

        {/* Input */}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full pl-12 pr-24 py-3 rounded-xl border ${inputBg} ${textColor} ${placeholderColor} backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all`}
          aria-label="Search blog posts"
        />

        {/* Clear Button */}
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className={`absolute right-20 top-1/2 -translate-y-1/2 p-1 rounded-full ${
              theme === 'light' ? 'hover:bg-gray-200' : 'hover:bg-white/10'
            } transition-colors`}
            aria-label="Clear search"
          >
            <svg 
              className={`w-4 h-4 ${theme === 'light' ? 'text-gray-400' : 'text-neutral-400'}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M6 18L18 6M6 6l12 12" 
              />
            </svg>
          </button>
        )}

        {/* Search Button */}
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-lg brand-bg text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Search
        </button>
      </div>
    </form>
  )
}
