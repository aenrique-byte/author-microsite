import React from 'react';

interface PreviewBoxProps {
  html: string;
  title?: string;
}

export const PreviewBox: React.FC<PreviewBoxProps> = ({ html, title }) => {
  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-800 shadow-sm transition-colors duration-200">
      {title && (
        <div className="bg-slate-100 dark:bg-slate-900 px-4 py-2 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {title}
        </div>
      )}
      <div className="p-4 bg-white dark:bg-slate-800 prose prose-sm max-w-none dark:prose-invert">
        {/* In a real app, use DOMPurify here. For this contained demo, we assume trusted inputs or warn user. */}
        <div dangerouslySetInnerHTML={{ __html: html }} />
        {!html && <p className="text-slate-400 dark:text-slate-500 italic text-sm">Preview will appear here...</p>}
      </div>
    </div>
  );
};