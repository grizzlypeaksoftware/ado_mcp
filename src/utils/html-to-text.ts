/**
 * Utility to convert HTML content to plain text.
 * Used for formatting work item descriptions for better readability.
 */

/**
 * Converts HTML content to plain text by stripping tags and decoding entities.
 * Preserves basic formatting like line breaks and paragraphs.
 *
 * @param html - The HTML string to convert
 * @returns Plain text representation of the HTML
 */
export function htmlToText(html: string | undefined | null): string | undefined {
  if (!html) {
    return undefined;
  }

  let text = html;

  // Replace block elements with line breaks
  text = text.replace(/<\/p>/gi, '\n\n');
  text = text.replace(/<\/div>/gi, '\n');
  text = text.replace(/<\/li>/gi, '\n');
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/h[1-6]>/gi, '\n\n');
  text = text.replace(/<\/tr>/gi, '\n');

  // Add bullet points for list items
  text = text.replace(/<li[^>]*>/gi, '• ');

  // Handle horizontal rules
  text = text.replace(/<hr\s*\/?>/gi, '\n---\n');

  // Strip remaining HTML tags
  text = text.replace(/<[^>]+>/g, '');

  // Decode common HTML entities
  text = text.replace(/&nbsp;/gi, ' ');
  text = text.replace(/&amp;/gi, '&');
  text = text.replace(/&lt;/gi, '<');
  text = text.replace(/&gt;/gi, '>');
  text = text.replace(/&quot;/gi, '"');
  text = text.replace(/&#39;/gi, "'");
  text = text.replace(/&apos;/gi, "'");
  text = text.replace(/&#x27;/gi, "'");
  text = text.replace(/&#x2F;/gi, '/');
  text = text.replace(/&ndash;/gi, '–');
  text = text.replace(/&mdash;/gi, '—');
  text = text.replace(/&hellip;/gi, '…');
  text = text.replace(/&copy;/gi, '©');
  text = text.replace(/&reg;/gi, '®');
  text = text.replace(/&trade;/gi, '™');

  // Decode numeric entities
  text = text.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)));
  text = text.replace(/&#x([0-9A-Fa-f]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)));

  // Clean up whitespace
  text = text.replace(/\r\n/g, '\n');  // Normalize line endings
  text = text.replace(/[ \t]+/g, ' ');  // Collapse horizontal whitespace
  text = text.replace(/\n{3,}/g, '\n\n');  // Limit consecutive newlines
  text = text.trim();

  return text || undefined;
}

/**
 * Formats a work item description, converting HTML to text if needed.
 * Returns the original if it doesn't appear to be HTML.
 *
 * @param description - The description which may be HTML or plain text
 * @returns Formatted plain text description
 */
export function formatDescription(description: string | undefined | null): string | undefined {
  if (!description) {
    return undefined;
  }

  // Check if it looks like HTML (contains tags)
  if (/<[^>]+>/.test(description)) {
    return htmlToText(description);
  }

  // Already plain text, just clean up whitespace
  return description.trim() || undefined;
}
