import { useState } from 'react'

export default function PasswordManager() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      setLoading(false)
      return
    }

    // Validate password strength
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/change-password.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          currentPassword,
          newPassword
        }),
      })

      const data = await response.json()

      if (data.success) {
        setMessage('Password changed successfully!')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setError(data.error || 'Failed to change password')
      }
    } catch (error) {
      setError('Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-6">Change Password</h2>
        
        {message && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {message}
          </div>
        )}
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter current password"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter new password (min 8 characters)"
              required
              minLength={8}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Confirm new password"
              required
              minLength={8}
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Changing Password...' : 'Change Password'}
            </button>
          </div>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Password Requirements</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Minimum 8 characters long</li>
            <li>• Use a unique password you haven't used before</li>
            <li>• Consider using a mix of letters, numbers, and symbols</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
