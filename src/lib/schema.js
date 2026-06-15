import { site } from '../data/site.js';

const ORG_ID = `${site.domain}/#business`;

// Stable LocalBusiness node referenced across pages.
export function localBusiness() {
  return {
    '@type': ['LocalBusiness', 'HomeAndConstructionBusiness'],
    '@id': ORG_ID,
    name: site.name,
    url: site.domain + '/',
    image: site.domain + site.teamPhoto,
    logo: site.domain + site.logo,
    telephone: '+972-52-4025710',
    email: site.email,
    foundingDate: site.founded,
    priceRange: '₪₪',
    areaServed: [
      { '@type': 'AdministrativeArea', name: 'מרכז' },
      { '@type': 'AdministrativeArea', name: 'צפון' },
      { '@type': 'AdministrativeArea', name: 'דרום' },
    ],
    address: { '@type': 'PostalAddress', addressCountry: 'IL' },
    openingHoursSpecification: [{
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
      opens: '09:00', closes: '18:30',
    }],
    sameAs: [],
  };
}

export function buildSchema({ route, title, description, h1, faq = [], image }) {
  const url = site.domain + route;
  const graph = [];

  // Website
  graph.push({
    '@type': 'WebSite', '@id': `${site.domain}/#website`,
    url: site.domain + '/', name: site.name, inLanguage: 'he-IL',
    publisher: { '@id': ORG_ID },
  });

  graph.push(localBusiness());

  // WebPage
  graph.push({
    '@type': 'WebPage', '@id': `${url}#webpage`,
    url, name: title, description, inLanguage: 'he-IL',
    isPartOf: { '@id': `${site.domain}/#website` },
    about: { '@id': ORG_ID },
    ...(image ? { primaryImageOfPage: image } : {}),
  });

  // Breadcrumb
  const crumbs = [{ name: 'דף הבית', url: site.domain + '/' }];
  if (route !== '/') crumbs.push({ name: h1 || title, url });
  graph.push({
    '@type': 'BreadcrumbList', '@id': `${url}#breadcrumb`,
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem', position: i + 1, name: c.name, item: c.url,
    })),
  });

  // Service (non-core pages)
  if (route !== '/' && !/מדיניות|נגישות|תנאי|אודות|צרו-קשר/.test(route)) {
    graph.push({
      '@type': 'Service', name: h1 || title, description,
      provider: { '@id': ORG_ID }, areaServed: 'IL', url,
    });
  }

  // FAQ
  if (faq.length) {
    graph.push({
      '@type': 'FAQPage', '@id': `${url}#faq`,
      mainEntity: faq.map((f) => ({
        '@type': 'Question', name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() },
      })),
    });
  }

  return { '@context': 'https://schema.org', '@graph': graph };
}
