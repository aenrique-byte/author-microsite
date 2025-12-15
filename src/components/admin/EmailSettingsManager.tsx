import { useState, useEffect } from 'react'
import { Mail, AlertCircle, CheckCircle } from 'lucide-react'

interface EmailConfig {
  smtp_host: string
  smtp_port: string
  smtp_user: string
  smtp_pass: string
  smtp_encryption: string
  from_email: string
  from_name: string
  admin_email: string
}

interface EmailDescriptions {
  [key: string]: string
}

export default function EmailSettingsManager() {
  const [config, setConfig] = useState<EmailConfig>({
    smtp_host: '',
    smtp_port: '465',
    smtp_user: '',
    smtp_pass: '',
    smtp_encryption: 'ssl',
    from_email: '',
    from_name: '',
    admin_email: ''
  })
  const [descriptions, setDescriptions] = useState<EmailDescriptions>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/email/get.php')
      const data = await response.json()
      
      if (data.config) {
        setConfig(data.config)
      }
      if (data.descriptions) {
        setDescriptions(data.descriptions)
      }
    } catch (err) {
      setError('Failed to load email configuration')
    } finally {
      setLoading(false)
    }
  }

  const saveConfig = async () => {
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/email/update.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify({ config }),
      })

      const data = await response.json()
      
      if (data.message) {
        setSuccess('Email settings updated successfully!')
        setTimeout(() => setSuccess(''), 3000)
        await loadConfig()
      } else {
        setError(data.error || 'Failed to update email settings')
      }
    } catch (err) {
      setError('Network error occurred')
    } finally {
      setSaving(false)
    }
  }

  const updateConfig = (key: keyof EmailConfig, value: string) => {
    setConfig(prev => ({
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
      <div className="mb-6 flex items-center gap-3">
        <Mail className="w-6 h-6 text-blue-600" />
        <div>
          <h2 className="text-lg font-medium text-gray-900">Email & SMTP Settings</h2>
          <p className="text-sm text-gray-600">
            Configure SMTP settings for sending emails (shoutouts, blog notifications, etc.)
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded flex items-start gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded flex items-start gap-2">
          <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* SMTP Server Settings */}
        <div className="border-b border-gray-200 pb-6">
          <h3 className="text-md font-semibold text-gray-800 mb-4">SMTP Server Configuration</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SMTP Host
              </label>
              <input
                type="text"
                value={config.smtp_host}
                onChange={(e) => updateConfig('smtp_host', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="smtp.hostinger.com"
              />
              {descriptions.smtp_host && (
                <p className="text-xs text-gray-500 mt-1">{descriptions.smtp_host}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SMTP Port
              </label>
              <input
                type="text"
                value={config.smtp_port}
                onChange={(e) => updateConfig('smtp_port', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="465"
              />
              {descriptions.smtp_port && (
                <p className="text-xs text-gray-500 mt-1">{descriptions.smtp_port}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Encryption
              </label>
              <select
                value={config.smtp_encryption}
                onChange={(e) => updateConfig('smtp_encryption', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ssl">SSL (Port 465)</option>
                <option value="tls">TLS (Port 587)</option>
              </select>
              {descriptions.smtp_encryption && (
                <p className="text-xs text-gray-500 mt-1">{descriptions.smtp_encryption}</p>
              )}
            </div>
          </div>
        </div>

        {/* SMTP Authentication */}
        <div className="border-b border-gray-200 pb-6">
          <h3 className="text-md font-semibold text-gray-800 mb-4">SMTP Authentication</h3>
          
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SMTP Username
              </label>
              <input
                type="text"
                value={config.smtp_user}
                onChange={(e) => updateConfig('smtp_user', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="your-email@yourdomain.com"
              />
              {descriptions.smtp_user && (
                <p className="text-xs text-gray-500 mt-1">{descriptions.smtp_user}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SMTP Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={config.smtp_pass}
                  onChange={(e) => updateConfig('smtp_pass', e.target.value)}
                  className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-blue-600 hover:text-blue-800"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {descriptions.smtp_pass && (
                <p className="text-xs text-gray-500 mt-1">{descriptions.smtp_pass}</p>
              )}
            </div>
          </div>
        </div>

        {/* Email Addresses */}
        <div>
          <h3 className="text-md font-semibold text-gray-800 mb-4">Email Addresses</h3>
          
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Email Address
              </label>
              <input
                type="email"
                value={config.from_email}
                onChange={(e) => updateConfig('from_email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="noreply@yourdomain.com"
              />
              {descriptions.from_email && (
                <p className="text-xs text-gray-500 mt-1">{descriptions.from_email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Name
              </label>
              <input
                type="text"
                value={config.from_name}
                onChange={(e) => updateConfig('from_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Author Website"
              />
              {descriptions.from_name && (
                <p className="text-xs text-gray-500 mt-1">{descriptions.from_name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Email (for notifications)
              </label>
              <input
                type="email"
                value={config.admin_email}
                onChange={(e) => updateConfig('admin_email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="admin@yourdomain.com"
              />
              {descriptions.admin_email && (
                <p className="text-xs text-gray-500 mt-1">{descriptions.admin_email}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 pt-4 border-t border-gray-200">
        <button
          onClick={saveConfig}
          disabled={saving}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <Mail className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Email Settings'}
        </button>
      </div>

      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-sm font-medium text-yellow-900 mb-2">⚠️ Important Notes</h3>
        <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
          <li>The "From Email" must be a valid mailbox on your domain (Hostinger requirement)</li>
          <li>Use SSL encryption (port 465) or TLS encryption (port 587)</li>
          <li>These settings are used by shoutouts, blog, and other notification features</li>
          <li>Store passwords securely - consider environment variables for production</li>
        </ul>
      </div>
    </div>
  )
}
