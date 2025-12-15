import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import LitrpgApp from './LitrpgApp';
import SocialIcons from '../../components/SocialIcons';
import PageNavbar from '../../components/PageNavbar';
import NewsletterCTA from '../../components/NewsletterCTA';
import PatreonCTA from '../../components/PatreonCTA';
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
      
      <PageNavbar breadcrumbs={[{ label: 'Tools' }]} />
      
      <div className="min-h-screen bg-nexus-dark text-slate-200 font-sans selection:bg-nexus-accent/30 selection:text-white flex flex-col">
        {/* Main App Content */}
        <LitrpgApp />

        {/* CTA */}
        <div className="px-4">
          <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-slate-700 bg-slate-800/60 p-6 text-center shadow-xl">
            <h2 className="text-2xl font-bold text-white">Get updates on new tools & releases</h2>
            <p className="mt-3 text-sm text-slate-200/80">
              Join the newsletter for update drops or support on Patreon to help keep the toolkit growing.
            </p>
            <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <NewsletterCTA variant="button" source="tools" />
              <PatreonCTA variant="button" />
            </div>
          </div>
        </div>

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
