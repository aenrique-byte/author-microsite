import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import LitrpgApp from './LitrpgApp';
import LitrpgHomePage from './pages/LitrpgHome';
import AttributesPage from './pages/AttributesPage';
import AbilitiesPage from './pages/AbilitiesPage';
import BestiaryPage from './pages/BestiaryPage';
import LootPage from './pages/LootPage';
import ContractsPage from './pages/ContractsPage';
import ClassesPage from './pages/ClassesPage';
import { getRandomBackground } from '../../utils/backgroundUtils';

interface AuthorProfile {
  name: string;
  bio: string;
  tagline: string;
  profile_image?: string;
  background_image?: string;
  background_image_light?: string;
  background_image_dark?: string;
  site_domain?: string;
}

// Character sheet wrapper
function CharacterSheetPage() {
  useEffect(() => {
    document.title = "Character Sheet - Destiny Among the Stars";
  }, []);

  return (
    <>
      <Helmet>
        <title>Character Sheet - Destiny Among the Stars</title>
        <meta name="description" content="Interactive character sheet for Destiny Among the Stars LitRPG." />
      </Helmet>
      
      {/* LitrpgApp has its own PageNavbar, LitrpgNav, background, and footer */}
      <LitrpgApp />
    </>
  );
}

export default function LitrpgRoute() {
  const [profile, setProfile] = useState<AuthorProfile | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('theme');
    return (savedTheme as 'light' | 'dark') || 'dark';
  });

  useEffect(() => {
    // Fetch author profile for background image
    fetch('/api/author/get.php')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setProfile(data.profile);
        }
      })
      .catch(err => {
        console.error('Failed to fetch author profile:', err);
      });

    // Listen for theme changes from localStorage
    const checkTheme = () => {
      const savedTheme = localStorage.getItem('theme');
      setTheme((savedTheme as 'light' | 'dark') || 'dark');
    };

    // Check theme periodically to sync with other components
    const interval = setInterval(checkTheme, 100);
    
    return () => clearInterval(interval);
  }, []);

  // Use theme-specific custom background if set, with smart fallback logic
  // getRandomBackground handles comma-separated filenames and randomly selects one
  const backgroundImage = profile
    ? theme === 'light'
      ? getRandomBackground(
          profile.background_image_light || profile.background_image,
          '/images/lofi_light_bg.webp'
        )
      : getRandomBackground(
          profile.background_image_dark || profile.background_image,
          '/images/lofi_bg.webp'
        )
    : theme === 'light'
      ? '/images/lofi_light_bg.webp'
      : '/images/lofi_bg.webp';

  const overlayClass = theme === 'light' ? 'bg-white/60' : 'bg-black/40';

  return (
    <div className="relative font-sans h-full transition-colors duration-200">
      {/* Fixed background layer */}
      <div
        className="fixed inset-0 -z-10 bg-no-repeat bg-top [background-size:auto_100%] md:[background-size:100%_auto]"
        style={{
          backgroundImage: `url('${backgroundImage}')`,
          backgroundColor: theme === 'light' ? '#f7f7f7' : '#0a0a0a',
        }}
      />
      {/* Overlay */}
      <div className={`fixed inset-0 ${overlayClass} -z-10`} />
      
      {/* Content */}
      <div className="relative z-10">
        <Routes>
          <Route index element={<CharacterSheetPage />} />
          <Route path="home" element={<LitrpgHomePage />} />
          <Route path="attributes" element={<AttributesPage />} />
          <Route path="abilities" element={<AbilitiesPage />} />
          <Route path="bestiary" element={<BestiaryPage />} />
          <Route path="loot" element={<LootPage />} />
          <Route path="contracts" element={<ContractsPage />} />
          <Route path="classes" element={<ClassesPage />} />
        </Routes>
      </div>
    </div>
  );
}
