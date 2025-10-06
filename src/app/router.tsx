import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { HomeRoute } from '../features/home'
import { GalleriesRoute } from '../features/galleries'
import { StorytimeRoute } from '../features/storytime'
import UnifiedAdminDashboard from '../components/admin/UnifiedAdminDashboard'
import { analytics } from '../lib/analytics'

function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    // Track page view on route change
    analytics.trackPageView();
  }, [location.pathname]);

  return null;
}

export function Router() {
  return (
    <>
      <AnalyticsTracker />
      <Routes>
        <Route path="/" element={<HomeRoute />} />
        <Route path="/galleries/*" element={<GalleriesRoute />} />
        <Route path="/storytime/*" element={<StorytimeRoute />} />
        <Route path="/admin/*" element={<UnifiedAdminDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
