// Adds stable id anchors to every <h2> in the content HTML and returns a table-of-contents
// list. Used to render an in-page "on this page" nav. Build-time, no client JS.
export function buildToc(html) {
  if (!html) return { html, toc: [] };
  const toc = [];
  const used = new Set();

  const slugify = (raw) => {
    let s = raw
      .replace(/<[^>]+>/g, '')          // strip any inline tags
      .replace(/&[a-z]+;/gi, ' ')       // entities -> space
      .replace(/[^֐-׿0-9A-Za-z\s-]/g, '') // keep Hebrew, latin, digits, space, hyphen
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    if (!s) s = 'section';
    let id = s, i = 2;
    while (used.has(id)) id = `${s}-${i++}`;
    used.add(id);
    return id;
  };

  const newHtml = html.replace(/<h2(\s[^>]*)?>([\s\S]*?)<\/h2>/g, (m, attrs, inner) => {
    const text = inner.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    if (!text) return m;
    if (attrs && /\sid=/.test(attrs)) {            // already has an id — reuse it
      const existing = attrs.match(/\sid="([^"]+)"/);
      toc.push({ id: existing ? existing[1] : slugify(inner), text });
      return m;
    }
    const id = slugify(inner);
    toc.push({ id, text });
    return `<h2${attrs || ''} id="${id}">${inner}</h2>`;
  });

  return { html: newHtml, toc };
}
