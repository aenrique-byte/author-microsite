import { useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import LitrpgApp from './LitrpgApp';
import SocialIcons from '../../components/SocialIcons';
import AttributesPage from './pages/AttributesPage';
import AbilitiesPage from './pages/AbilitiesPage';
import BestiaryPage from './pages/BestiaryPage';
import LootPage from './pages/LootPage';
import ContractsPage from './pages/ContractsPage';
import ClassesPage from './pages/ClassesPage';

// Main homepage wrapper
function LitrpgHome() {
  useEffect(() => {
    document.title = "LitRPG Tools - Destiny Among the Stars";
  }, []);

  return (
    <>
      <Helmet>
        <title>LitRPG Tools - Destiny Among the Stars</title>
        <meta name="description" content="Interactive character sheet, bestiary, and game tools for Destiny Among the Stars LitRPG." />
      </Helmet>
      
      <div className="min-h-screen bg-nexus-dark text-slate-200 font-sans selection:bg-nexus-accent/30 selection:text-white flex flex-col">
        {/* Breadcrumb Navigation */}
        <div className="bg-slate-900/90 border-b border-slate-700 py-3 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Link to="/" className="hover:text-nexus-accent hover:underline transition-colors">
                Home
              </Link>
              <span className="text-slate-600">/</span>
              <span className="text-slate-200">LitRPG Tools</span>
            </div>
          </div>
        </div>

        {/* Main App Content */}
        <LitrpgApp />

        {/* Footer with Social Icons */}
        <footer className="bg-slate-900 border-t border-slate-700 py-8">
          <div className="mx-auto max-w-5xl px-4">
            <div className="flex flex-col items-center gap-4">
              <SocialIcons variant="footer" showCopyright={false} />
              <p className="text-sm text-slate-500">
                © {new Date().getFullYear()} All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

export default function LitrpgRoute() {
  return (
    <Routes>
      <Route index element={<LitrpgHome />} />
      <Route path="attributes" element={<AttributesPage />} />
      <Route path="abilities" element={<AbilitiesPage />} />
      <Route path="bestiary" element={<BestiaryPage />} />
      <Route path="loot" element={<LootPage />} />
      <Route path="contracts" element={<ContractsPage />} />
      <Route path="classes" element={<ClassesPage />} />
    </Routes>
  );
}
