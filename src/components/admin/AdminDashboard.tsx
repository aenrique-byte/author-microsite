import { Routes, Route } from 'react-router-dom'
import { useState } from 'react'
import StoryManagerComponent from './StoryManager'
import UploadManager from './UploadManager'

export default function AdminDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-2xl font-bold mb-6 text-center">Admin Login</h1>
          <form onSubmit={(e) => {
            e.preventDefault()
            // For now, just log in without validation
            setIsLoggedIn(true)
          }}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Username
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter username"
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Password
              </label>
              <input
                type="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter password"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Author CMS Admin</h1>
            </div>
            <div className="flex items-center space-x-4">
              <a href="/" className="text-gray-600 hover:text-gray-900">
                View Site
              </a>
              <button
                onClick={() => setIsLoggedIn(false)}
                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<AdminHome />} />
          <Route path="/author" element={<AuthorProfileManager />} />
          <Route path="/galleries" element={<GalleryManager />} />
          <Route path="/stories" element={<StoryManagerComponent />} />
          <Route path="/uploads" element={<UploadManager />} />
          <Route path="/socials" element={<SocialManager />} />
        </Routes>
      </div>
    </div>
  )
}

function AdminHome() {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Admin Dashboard</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <AdminCard title="Author Profile" href="/admin/author" description="Manage author bio and profile" />
          <AdminCard title="Image Galleries" href="/admin/galleries" description="Manage image galleries" />
          <AdminCard title="Stories" href="/admin/stories" description="Manage stories and chapters" />
          <AdminCard title="Upload Manager" href="/admin/uploads" description="Manage uploaded images" />
          <AdminCard title="Social Media" href="/admin/socials" description="Manage social media links" />
        </div>
      </div>
    </div>
  )
}

function AdminCard({ title, href, description }: { title: string; href: string; description: string }) {
  return (
    <a href={href} className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <h3 className="font-medium text-gray-900">{title}</h3>
      <p className="text-sm text-gray-600 mt-1">{description}</p>
    </a>
  )
}

function AuthorProfileManager() {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium mb-4">Author Profile</h2>
      <p className="text-gray-600">Author profile management coming soon...</p>
    </div>
  )
}

function GalleryManager() {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium mb-4">Gallery Management</h2>
      <p className="text-gray-600">Gallery management coming soon...</p>
    </div>
  )
}

function SocialManager() {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium mb-4">Social Media Links</h2>
      <p className="text-gray-600">Social media management coming soon...</p>
    </div>
  )
}
