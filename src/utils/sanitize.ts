const STRIP_TAGS = /<\s*\/?\s*(script|iframe|object|embed|base|form|input|textarea|button|link|meta|style|svg|math)\b[^>]*>/gi;
const STRIP_EVENT_HANDLERS = /\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;
const STRIP_JAVASCRIPT_URLS = /href\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi;
const STRIP_DATA_URLS_SCRIPT = /src\s*=\s*(?:"data:[^"]*script[^"]*"|'data:[^']*script[^']*')/gi;

export function sanitizeHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(STRIP_TAGS, '')
    .replace(STRIP_EVENT_HANDLERS, '')
    .replace(STRIP_JAVASCRIPT_URLS, ' href=""')
    .replace(STRIP_DATA_URLS_SCRIPT, ' src=""');
}
