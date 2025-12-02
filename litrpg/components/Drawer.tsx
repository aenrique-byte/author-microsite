import React from 'react';
import { X } from 'lucide-react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  position?: 'left' | 'right';
  width?: string;
}

export const Drawer: React.FC<DrawerProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  position = 'right',
  width = 'w-96'
}) => {
  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      
      {/* Drawer Panel */}
      <div 
        className={`fixed top-0 bottom-0 z-50 bg-nexus-panel border-r border-l border-slate-700 shadow-2xl transition-transform duration-300 transform ${
          position === 'right' 
            ? 'right-0 border-l' 
            : 'left-0 border-r'
        } ${width} ${
          isOpen 
            ? 'translate-x-0' 
            : position === 'right' ? 'translate-x-full' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-900/50">
            <h2 className="text-xl font-bold text-nexus-accent tracking-wide uppercase font-mono">{title}</h2>
            <button 
              onClick={onClose}
              className="p-1 hover:bg-slate-700 rounded-full transition-colors text-slate-400 hover:text-white"
            >
              <X size={24} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {children}
          </div>
        </div>
      </div>
    </>
  );
};