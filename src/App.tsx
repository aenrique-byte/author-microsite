import { Routes, Route, Navigate } from 'react-router-dom'
import AuthorHomepage from './components/AuthorHomepage'
import UnifiedAdminDashboard from './components/admin/UnifiedAdminDashboard'

function App() {
  return (
    <Routes>
      <Route path="/" element={<AuthorHomepage />} />
      <Route path="/admin/*" element={<UnifiedAdminDashboard />} />
      <Route path="/galleries" element={<Navigate to="/galleries/" replace />} />
    </Routes>
  )
}

export default App
