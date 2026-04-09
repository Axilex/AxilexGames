import sanitizeHtml from 'sanitize-html';

/** French Wikipedia namespace prefixes to strip */
const BLOCKED_PREFIXES = [
  '/wiki/Spécial:',
  '/wiki/Aide:',
  '/wiki/Modèle:',
  '/wiki/Fichier:',
  '/wiki/Catégorie:',
  '/wiki/Wikipédia:',
  '/wiki/Portail:',
  '/wiki/Projet:',
  '/wiki/Discussion:',
  '/wiki/Utilisateur:',
  '/wiki/Special:',
  '/wiki/Help:',
  '/wiki/Template:',
  '/wiki/File:',
  '/wiki/Category:',
  '/wiki/Wikipedia:',
  '/wiki/Talk:',
  '/wiki/User:',
];

function toWikiPath(href: string): string | null {
  if (!href) return null;

  // Parsoid relative format: ./Slug or ./Slug#section
  if (href.startsWith('./')) {
    const slug = href.slice(2).split('#')[0];
    if (!slug) return null;
    return `/wiki/${slug}`;
  }

  // Full URL: https://fr.wikipedia.org/wiki/Slug
  const wikiMatch = href.match(/^https?:\/\/[a-z.]+\.wikipedia\.org\/wiki\/(.+?)(?:#.*)?$/);
  if (wikiMatch) {
    return `/wiki/${wikiMatch[1]}`;
  }

  // Already in /wiki/ form
  if (href.startsWith('/wiki/')) {
    return href.split('#')[0];
  }

  return null;
}

function isBlocked(wikiPath: string): boolean {
  return BLOCKED_PREFIXES.some((prefix) => wikiPath.startsWith(prefix));
}

/**
 * Pure function — strips all unsafe content from raw Wikipedia Parsoid HTML.
 * Returns clean HTML where every <a> href is in /wiki/Slug form.
 * Images are kept if their src is from Wikimedia origins.
 */
export function sanitizeWikipediaHtml(rawHtml: string): string {
  return sanitizeHtml(rawHtml, {
    allowedTags: [
      'p',
      'h1',
      'h2',
      'h3',
      'h4',
      'a',
      'b',
      'i',
      'strong',
      'em',
      'ul',
      'ol',
      'li',
      'dl',
      'dt',
      'dd',
      'table',
      'tbody',
      'thead',
      'tfoot',
      'tr',
      'td',
      'th',
      'caption',
      'span',
      'div',
      'sup',
      'sub',
      'br',
      'hr',
      'blockquote',
      'section',
      'nav',
      'figure',
      'figcaption',
      'img',
      'small',
      'abbr',
      's',
      'h5',
      'h6',
    ],
    allowedAttributes: {
      a: ['href', 'id'],
      img: ['src', 'alt', 'width', 'height', 'decoding', 'loading'],
      figure: ['class', 'typeof'],
      figcaption: ['class'],
      table: ['class', 'style'],
      thead: ['class'],
      tbody: ['class'],
      tfoot: ['class'],
      tr: ['class', 'style'],
      th: ['scope', 'colspan', 'rowspan', 'class', 'style'],
      td: ['colspan', 'rowspan', 'class', 'style'],
      div: ['class', 'style', 'id'],
      span: ['class', 'style'],
      section: ['class', 'id'],
      nav: ['class', 'id', 'role'],
      h1: ['id'],
      h2: ['id'],
      h3: ['id'],
      h4: ['id'],
      h5: ['id'],
      h6: ['id'],
      abbr: ['title'],
    },
    transformTags: {
      a: (tagName, attribs) => {
        const href = attribs['href'] ?? '';
        // Allow in-page anchor links (TOC navigation)
        if (href.startsWith('#')) {
          return { tagName: 'a', attribs: { href } };
        }
        const wikiPath = toWikiPath(href);
        if (!wikiPath || isBlocked(wikiPath)) {
          // Unwrap to plain text — strip the link but keep the label
          return { tagName: 'span', attribs: {} as Record<string, string> };
        }
        return { tagName: 'a', attribs: { href: wikiPath } };
      },
      img: (_tagName, attribs) => {
        let src = attribs['src'] ?? '';
        // Convert protocol-relative URLs to https
        if (src.startsWith('//')) src = `https:${src}`;
        // Only allow images from Wikimedia (prevents arbitrary external image loads)
        if (
          !src.startsWith('https://upload.wikimedia.org/') &&
          !src.startsWith('https://bits.wikimedia.org/')
        ) {
          return { tagName: 'span', attribs: {} as Record<string, string> };
        }
        const clean: Record<string, string> = { src, alt: attribs['alt'] ?? '' };
        if (attribs['width']) clean['width'] = attribs['width'];
        if (attribs['height']) clean['height'] = attribs['height'];
        if (attribs['decoding']) clean['decoding'] = attribs['decoding'];
        if (attribs['loading']) clean['loading'] = attribs['loading'];
        return { tagName: 'img', attribs: clean };
      },
    },
    // Strip everything else: script, style tags, audio, video, etc.
    disallowedTagsMode: 'discard',
  });
}

/** Extract all valid wiki slugs from sanitized HTML */
export function extractSlugsFromHtml(html: string): Set<string> {
  const slugs = new Set<string>();
  const regex = /href="\/wiki\/([^"]+)"/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    slugs.add(decodeURIComponent(match[1]));
  }
  return slugs;
}
