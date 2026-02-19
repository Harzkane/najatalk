// /app/sitemap.xml/route.ts
export async function GET() {
  const baseUrl = "https://harunakane.com"; // Replace with your actual domain

  const pages = [
    { url: "/", priority: "1.0", changefreq: "weekly" },
    { url: "/projects", priority: "0.9", changefreq: "weekly" },
    { url: "/about", priority: "0.8", changefreq: "monthly" },
    { url: "/contact", priority: "0.9", changefreq: "monthly" },
    { url: "/privacy-policy", priority: "0.5", changefreq: "yearly" },
    { url: "/terms-of-service", priority: "0.5", changefreq: "yearly" },
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${pages
      .map(
        (page) => `
    <url>
      <loc>${baseUrl}${page.url}</loc>
      <lastmod>${new Date().toISOString()}</lastmod>
      <changefreq>${page.changefreq}</changefreq>
      <priority>${page.priority}</priority>
    </url>
    `
      )
      .join("")}
  </urlset>`;

  return new Response(sitemap, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
