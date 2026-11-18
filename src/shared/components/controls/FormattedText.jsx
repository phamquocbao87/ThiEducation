import React from 'react';

/**
 * FormattedText — Render pedagogical rich text with 100% backward compatibility
 * Safely handles:
 * - HTML tags (<strong>, <em>, <u>, <ul>, <ol>, <li>, <p>, <br>)
 * - Corrupted or legacy markdown (******bold******, **bold**, *italic*)
 * - Plain text
 */
export const FormattedText = ({
  content,
  style,
  className,
  as: Component = 'span',
  fallback = null,
}) => {
  if (content === null || content === undefined || content === '') {
    return fallback;
  }

  const raw = String(content);

  // 1. Repair stacked asterisks from legacy editor bug (e.g. ******text****** -> **text**)
  let html = raw.replace(/\*{4,}/g, '**');

  // 2. Convert legacy markdown to HTML tags
  html = html
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');

  // 3. Check if content contains HTML tags
  const hasHtml = /<(strong|b|em|i|u|ul|ol|li|p|span|div|br)\b[^>]*>/i.test(html);

  if (hasHtml) {
    return (
      <Component
        className={className}
        style={style}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <Component className={className} style={style}>
      {raw}
    </Component>
  );
};
