import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { HomeRoute } from '../features/home'
import { GalleriesRoute } from '../features/galleries'
import { StorytimeRoute } from '../features/storytime'
import { LitrpgRoute } from '../features/litrpg'
import { ShoutoutsRoute } from '../features/shoutouts'
import { BlogRoute } from '../features/blog'
import { CritiqueRoomRoute } from '../features/critiqueroom'
import UnifiedAdminDashboard from '../components/admin/UnifiedAdminDashboard'
import UniversePortalHomepage from '../components/UniversePortalHomepage'
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
        <Route path="/" element={<UniversePortalHomepage />} />
        <Route path="/homepage-classic" element={<HomeRoute />} />
        <Route path="/galleries/*" element={<GalleriesRoute />} />
        <Route path="/storytime/*" element={<StorytimeRoute />} />
        <Route path="/blog/*" element={<BlogRoute />} />
        <Route path="/litrpg/*" element={<LitrpgRoute />} />
        <Route path="/shoutouts/*" element={<ShoutoutsRoute />} />
        <Route path="/critiqueroom/*" element={<CritiqueRoomRoute />} />
        <Route path="/admin/*" element={<UnifiedAdminDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
