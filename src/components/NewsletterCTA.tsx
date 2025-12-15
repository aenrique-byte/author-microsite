import { useState, type ReactNode } from 'react'
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
  const { theme } = useTheme()

  const textPrimary = theme === 'light' ? 'text-gray-900' : 'text-white'
  const textSecondary = theme === 'light' ? 'text-gray-700' : 'text-neutral-200'
  const cardBg = theme === 'light'
    ? 'bg-white/70 border-gray-200 backdrop-blur'
    : 'bg-neutral-900/70 border-white/10 backdrop-blur'

  const openDrawer = () => setIsOpen(true)
  const closeDrawer = () => setIsOpen(false)

  const renderButton = (content: ReactNode, extraClasses = '') => (
    <button
      type="button"
      onClick={openDrawer}
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${extraClasses}`}
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
        <div className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 border rounded-2xl p-5 ${cardBg} ${className}`}>
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              📬
            </div>
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.18em] text-emerald-500`}>Newsletter</p>
              <h3 className={`text-lg font-bold ${textPrimary}`}>Get the latest drops</h3>
              <p className={`text-sm ${textSecondary}`}>
                Be first to know about new chapters, blog posts, and gallery drops.
              </p>
            </div>
          </div>
          <div className="flex-shrink-0 w-full sm:w-auto">
            {renderButton(buttonText || 'Join the mailing list', 'w-full sm:w-auto')}
          </div>
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
