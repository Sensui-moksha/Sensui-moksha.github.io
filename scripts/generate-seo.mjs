import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.resolve(rootDir, 'public');
const distDir = path.resolve(rootDir, 'dist');

const SITE_URL = 'https://sensui-moksha.github.io';

// Get last modified date from git or fallback to today's date
function getLastModifiedDate() {
  try {
    const gitDate = execSync('git log -1 --format=%cd --date=short', {
      encoding: 'utf8',
      cwd: rootDir,
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    if (gitDate && /^\d{4}-\d{2}-\d{2}$/.test(gitDate)) {
      return gitDate;
    }
  } catch {
    // git not available or untracked
  }
  return new Date().toISOString().split('T')[0];
}

const lastmod = getLastModifiedDate();

// Define pages/routes and their metadata
const routes = [
  {
    path: '/',
    priority: '1.0',
    changefreq: 'weekly',
    images: [
      {
        loc: `${SITE_URL}/images/mypicnbg.png`,
        title: 'Mokshyagna Yadav — Engineering Student & Full-Stack Developer',
        caption: 'Mokshyagna Yadav (Sensui-moksha) Portfolio'
      },
      {
        loc: `${SITE_URL}/images/icon.png`,
        title: 'Sensui-moksha Logo & Brand Icon',
        caption: 'Sensui-moksha Portfolio Icon'
      },
      {
        loc: `${SITE_URL}/images/project-1.webp`,
        title: 'Featured Project 1 Showcase'
      },
      {
        loc: `${SITE_URL}/images/project-2.webp`,
        title: 'Featured Project 2 Showcase'
      },
      {
        loc: `${SITE_URL}/images/project-3.webp`,
        title: 'Featured Project 3 Showcase'
      },
      {
        loc: `${SITE_URL}/images/project-4.webp`,
        title: 'Featured Project 4 Showcase'
      },
      {
        loc: `${SITE_URL}/images/project-5.webp`,
        title: 'Featured Project 5 Showcase'
      }
    ]
  }
];

function generateSitemap() {
  const urlsXml = routes.map((r) => {
    const loc = `${SITE_URL}${r.path}`;
    const imagesXml = (r.images || [])
      .map(
        (img) => `    <image:image>
      <image:loc>${img.loc}</image:loc>
      <image:title>${img.title}</image:title>${img.caption ? `\n      <image:caption>${img.caption}</image:caption>` : ''}
    </image:image>`
      )
      .join('\n');

    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
${imagesXml}
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlsXml}
</urlset>
`;
}

function generateRobotsTxt() {
  return `# Robots.txt for Sensui-moksha Portfolio
# Website: ${SITE_URL}

User-agent: *
Allow: /

# Allow major search engine crawlers explicit access
User-agent: Googlebot
Allow: /

User-agent: Googlebot-Image
Allow: /images/

User-agent: Bingbot
Allow: /

User-agent: DuckDuckBot
Allow: /

User-agent: Yandex
Allow: /

User-agent: Applebot
Allow: /

# Canonical host and sitemap location
Host: ${SITE_URL}
Sitemap: ${SITE_URL}/sitemap.xml
`;
}

function run() {
  console.log(`[SEO Generator] Generating sitemap.xml and robots.txt (lastmod: ${lastmod})...`);

  const sitemapContent = generateSitemap();
  const robotsContent = generateRobotsTxt();

  // 1. Write to public/ directory
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemapContent, 'utf8');
  fs.writeFileSync(path.join(publicDir, 'robots.txt'), robotsContent, 'utf8');
  console.log(`[SEO Generator] Successfully updated public/sitemap.xml and public/robots.txt`);

  // 2. Also write to dist/ directory if dist/ exists
  if (fs.existsSync(distDir)) {
    fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemapContent, 'utf8');
    fs.writeFileSync(path.join(distDir, 'robots.txt'), robotsContent, 'utf8');
    console.log(`[SEO Generator] Also synced to dist/sitemap.xml and dist/robots.txt`);
  }
}

run();
