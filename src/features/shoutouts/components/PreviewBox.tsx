interface PreviewBoxProps {
  html: string;
  title?: string;
}

export default function PreviewBox({ html, title }: PreviewBoxProps) {
  return (
    <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden bg-white dark:bg-neutral-800 shadow-sm transition-colors duration-200">
      {title && (
        <div className="bg-neutral-100 dark:bg-neutral-900 px-4 py-2 border-b border-neutral-200 dark:border-neutral-700 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
          {title}
        </div>
      )}
      <div className="p-4 bg-white dark:bg-neutral-800 prose prose-sm max-w-none dark:prose-invert">
        {/* Note: Using dangerouslySetInnerHTML for user-provided HTML. 
            In production, you should sanitize with DOMPurify */}
        <div dangerouslySetInnerHTML={{ __html: html }} />
        {!html && <p className="text-neutral-400 dark:text-neutral-500 italic text-sm">Preview will appear here...</p>}
      </div>
    </div>
  );
}
