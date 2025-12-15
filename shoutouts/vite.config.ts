import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync, mkdirSync, readdirSync, statSync } from 'fs';

// Plugin to copy API folder and public .htaccess to dist
function copyApiFolder() {
  return {
    name: 'copy-api-folder',
    closeBundle() {
      const apiSrc = path.resolve(__dirname, 'api');
      const apiDest = path.resolve(__dirname, 'dist/api');
      
      // Create api directory in dist
      mkdirSync(apiDest, { recursive: true });
      
      // Copy all files from api to dist/api
      const files = readdirSync(apiSrc);
      files.forEach(file => {
        const srcPath = path.join(apiSrc, file);
        const destPath = path.join(apiDest, file);
        
        if (statSync(srcPath).isFile()) {
          copyFileSync(srcPath, destPath);
          console.log(`Copied: api/${file} → dist/api/${file}`);
        }
      });
      
      console.log('✓ API folder copied to dist/api');
      
      // Copy .htaccess from public to dist root
      const htaccessSrc = path.resolve(__dirname, 'public/.htaccess');
      const htaccessDest = path.resolve(__dirname, 'dist/.htaccess');
      
      try {
        copyFileSync(htaccessSrc, htaccessDest);
        console.log('✓ .htaccess copied to dist/');
      } catch (e) {
        console.log('⚠ No .htaccess found in public folder');
      }
    }
  };
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      base: '/shoutouts/', // Set base path for subfolder deployment
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), copyApiFolder()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
