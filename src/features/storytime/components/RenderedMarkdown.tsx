import { useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

interface RenderedMarkdownProps {
  markdown: string;
  className?: string;
}

export function RenderedMarkdown({ markdown, className }: RenderedMarkdownProps) {
  const sanitizedHtml = useMemo(() => {
    if (!markdown) return { __html: '' };
    const dirtyHtml = marked.parse(markdown) as string;
    return { __html: DOMPurify.sanitize(dirtyHtml, { ADD_TAGS: ["img"], ADD_ATTR: ['src', 'alt', 'title', 'class'] }) };
  }, [markdown]);

  return <div className={className} dangerouslySetInnerHTML={sanitizedHtml} />;
}
