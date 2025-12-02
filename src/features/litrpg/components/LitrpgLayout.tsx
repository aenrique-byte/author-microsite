import React from 'react';
import { Helmet } from 'react-helmet-async';
import SocialIcons from '../../../components/SocialIcons';
import LitrpgNav from './LitrpgNav';

interface LitrpgLayoutProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

const LitrpgLayout: React.FC<LitrpgLayoutProps> = ({ title, description, children }) => {

  return (
    <>
      <Helmet>
        <title>{title} - Destiny Among the Stars</title>
        {description && <meta name="description" content={description} />}
      </Helmet>
      
      <div className="min-h-screen bg-nexus-dark text-slate-200 font-sans selection:bg-nexus-accent/30 selection:text-white flex flex-col">
        {/* Shared Navigation */}
        <LitrpgNav />

        {/* Main Content */}
        <div className="flex-1">
          {children}
        </div>

        {/* Footer with Social Icons */}
        <footer className="bg-slate-900 border-t border-slate-700 py-8">
          <div className="mx-auto max-w-6xl px-4">
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
};

export default LitrpgLayout;
