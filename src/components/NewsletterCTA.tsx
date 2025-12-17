import { useState, useEffect, type ReactNode } from 'react'
import NewsletterDrawer from './NewsletterDrawer'
import { useTheme } from '../features/storytime/contexts/ThemeContext'

interface NewsletterCTAProps {
  variant: 'button' | 'card' | 'inline'
  source: string
  className?: string
  buttonText?: string
}

export default function NewsletterCTA({ variant, source, className = '', buttonText }: NewsletterCTAProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [brandColor, setBrandColor] = useState('#585137')
  const [brandColorDark, setBrandColorDark] = useState('#c79c00')
  const { theme } = useTheme()

  // Fetch brand colors from API
  useEffect(() => {
    const fetchBrandColors = async () => {
      try {
        const res = await fetch('/api/homepage/settings.php')
        if (res.ok) {
          const data = await res.json()
          if (data.success && data.settings) {
            setBrandColor(data.settings.brand_color || '#585137')
            setBrandColorDark(data.settings.brand_color_dark || '#c79c00')
          }
        }
      } catch (err) {
        console.warn('Failed to fetch brand colors:', err)
      }
    }
    fetchBrandColors()
  }, [])

  const textPrimary = theme === 'light' ? 'text-gray-900' : 'text-white'
  const textSecondary = theme === 'light' ? 'text-gray-700' : 'text-neutral-200'
  const cardBg = theme === 'light'
    ? 'bg-white/70 border-gray-200 backdrop-blur'
    : 'bg-neutral-900/70 border-white/10 backdrop-blur'

  const accentColor = theme === 'light' ? brandColor : brandColorDark

  const openDrawer = () => setIsOpen(true)
  const closeDrawer = () => setIsOpen(false)

  const renderButton = (content: ReactNode, extraClasses = '') => (
    <button
      type="button"
      onClick={openDrawer}
      style={{
        backgroundColor: accentColor,
        boxShadow: `0 10px 15px -3px ${accentColor}20`,
      }}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-lg hover:opacity-90 transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${extraClasses}`}
      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme === 'light' ? '#4a442f' : '#d4a600'}
      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = accentColor}
    >
      {content}
    </button>
  )

  return (
    <>
      {variant === 'button' && (
        <div className={className}>
          {renderButton(buttonText || 'Join the mailing list')}
        </div>
      )}

      {variant === 'inline' && (
        <button
          type="button"
          onClick={openDrawer}
          className={`text-sm font-semibold underline-offset-4 hover:underline ${textSecondary} ${className}`}
        >
          {buttonText || 'Get email updates'} →
        </button>
      )}

      {variant === 'card' && (
        <div className={`flex flex-col gap-4 border rounded-2xl p-4 ${cardBg} ${className}`}>
          <div className="flex items-start gap-3">
            <div
              className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full text-xl"
              style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
            >
              📬
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-xs font-semibold uppercase tracking-[0.18em]"
                style={{ color: accentColor }}
              >
                Newsletter
              </p>
              <h3 className={`text-base font-bold ${textPrimary} mt-1`}>Get the latest drops</h3>
            </div>
          </div>
          <p className={`text-sm ${textSecondary}`}>
            Be first to know about new chapters, blog posts, and gallery drops.
          </p>
          {renderButton(buttonText || 'Join the mailing list', 'w-full')}
        </div>
      )}

      <NewsletterDrawer
        isOpen={isOpen}
        onClose={closeDrawer}
        source={source}
        defaultMessage={buttonText}
      />
    </>
  )
}
