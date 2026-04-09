import { sanitizeWikipediaHtml, extractSlugsFromHtml } from './sanitizer';

const SAMPLE_PARSOID_HTML = `
<section>
  <p>La <a href="./France" title="France">France</a> est un pays d'Europe.</p>
  <p>Sa capitale est <a href="./Paris" title="Paris">Paris</a>.</p>
  <p>Lien externe : <a href="https://example.com">exemple</a></p>
  <p>Lien full wiki : <a href="https://fr.wikipedia.org/wiki/Lyon">Lyon</a></p>
  <p>Lien avec section : <a href="./Paris#Histoire">Paris§Histoire</a></p>
  <p>Fichier : <a href="./Fichier:Flag.svg">Drapeau</a></p>
  <p>Catégorie : <a href="./Catégorie:Pays_d'Europe">Catégorie</a></p>
  <p>Portail : <a href="./Portail:France">Portail France</a></p>
  <p>Spécial : <a href="./Spécial:Recherche">Recherche</a></p>
  <img src="flag.png" alt="Drapeau" />
  <figure><img src="photo.jpg" /></figure>
  <script>alert('xss')</script>
  <style>.test { color: red }</style>
  <table>
    <tr><th scope="col">Col</th><td>Valeur</td></tr>
  </table>
</section>
`;

describe('sanitizeWikipediaHtml', () => {
  let result: string;

  beforeAll(() => {
    result = sanitizeWikipediaHtml(SAMPLE_PARSOID_HTML);
  });

  it('converts Parsoid ./Slug links to /wiki/Slug', () => {
    expect(result).toContain('href="/wiki/France"');
    expect(result).toContain('href="/wiki/Paris"');
  });

  it('converts full fr.wikipedia.org URLs to /wiki/Slug', () => {
    expect(result).toContain('href="/wiki/Lyon"');
  });

  it('strips the section fragment from links', () => {
    // Paris#Histoire → /wiki/Paris
    expect(result).toContain('href="/wiki/Paris"');
    expect(result).not.toContain('#Histoire');
  });

  it('strips external links (replaces <a> with <span>)', () => {
    expect(result).not.toContain('href="https://example.com"');
  });

  it('strips Fichier: namespace links', () => {
    expect(result).not.toContain('/wiki/Fichier:');
  });

  it('strips Catégorie: namespace links', () => {
    expect(result).not.toContain('/wiki/Catégorie:');
  });

  it('strips Portail: namespace links', () => {
    expect(result).not.toContain('/wiki/Portail:');
  });

  it('strips Spécial: namespace links', () => {
    expect(result).not.toContain('/wiki/Spécial:');
  });

  it('strips <img> tags whose src is not from Wikimedia', () => {
    // flag.png and photo.jpg are not Wikimedia URLs → stripped
    expect(result).not.toContain('src="flag.png"');
    expect(result).not.toContain('src="photo.jpg"');
  });

  it('preserves <figure> tags (images/infoboxes are allowed)', () => {
    expect(result).toContain('<figure');
  });

  it('strips <script> tags', () => {
    expect(result).not.toContain('<script');
    expect(result).not.toContain("alert('xss')");
  });

  it('strips <style> tags', () => {
    expect(result).not.toContain('<style');
  });

  it('preserves allowed structural tags (p, table, th, td)', () => {
    expect(result).toContain('<p>');
    expect(result).toContain('<table>');
    expect(result).toContain('<th');
    expect(result).toContain('<td>');
  });
});

describe('extractSlugsFromHtml', () => {
  it('returns all /wiki/ slugs from sanitized HTML', () => {
    const html = sanitizeWikipediaHtml(SAMPLE_PARSOID_HTML);
    const slugs = extractSlugsFromHtml(html);
    expect(slugs.has('France')).toBe(true);
    expect(slugs.has('Paris')).toBe(true);
    expect(slugs.has('Lyon')).toBe(true);
  });

  it('does not include blocked namespace links', () => {
    const html = sanitizeWikipediaHtml(SAMPLE_PARSOID_HTML);
    const slugs = extractSlugsFromHtml(html);
    for (const slug of slugs) {
      expect(slug).not.toMatch(/^Fichier:|^Catégorie:|^Portail:|^Spécial:/);
    }
  });

  it('returns an empty set for HTML with no wiki links', () => {
    const slugs = extractSlugsFromHtml('<p>Pas de liens ici.</p>');
    expect(slugs.size).toBe(0);
  });
});
