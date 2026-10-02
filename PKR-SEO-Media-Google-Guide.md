# PKR website: SEO, media updates, and Google Search Console

## 1. Local SEO strategies for Pakistan cold-storage searches

### Keep business information identical
Use exactly the same business name, phone numbers, email, address, and service areas on the website, Google Business Profile, Facebook, supplier profiles, directories, quotations, and PDFs. Inconsistent NAP data weakens local trust signals.

### Improve Google Business Profile
Complete the profile with the most accurate primary category, service areas, hours, phone/WhatsApp, website, logo, and real project photos. Add new photos regularly. Ask genuine customers for honest reviews and reply to every review. Do not buy reviews or publish reviews from staff.

### Build useful service and location content
Create factual, crawlable content for:

- Cold storage design and installation in Pakistan
- Cold rooms and freezer rooms
- Blast freezer systems
- Fruit and banana ripening chambers
- Industrial refrigeration
- Pharmaceutical cold chain
- PU/PIR insulation panels and doors
- Refrigeration piping, controls, maintenance, and commissioning

Only create city pages when PKR genuinely serves that city and each page has unique content: project examples, service area, photos, FAQs, response process, and a clear quote/contact action. Avoid copying one page for every city.

### Publish real project case studies
For approved projects, include the city, industry, approximate capacity, required temperature range, product, solution, photos, installation details, and outcome. These pages can attract both search traffic and relevant local links.

### Earn relevant links
Pursue legitimate mentions from refrigeration suppliers, food and agriculture associations, chambers of commerce, customers, logistics companies, and Pakistan business directories. Prefer a few relevant links over large numbers of low-quality links.

### Measure and improve
In Search Console, find pages with impressions but weak click-through rate, or queries ranking around positions 5–20. Improve the title, description, visible answer, internal links, and proof on those pages. Google ranking cannot be guaranteed; this process improves eligibility and evidence.

## 2. Manual image, video, and PDF updates

The current site reads media from `content/media.json`.

### Add an image

```bash
cd /path/to/pkr-website
cp /path/to/new-image.jpg assets/new-image.jpg
```

Add this object inside the `gallery` array in `content/media.json`:

```json
{"id":"new-project","title":"New Project","description":"Short factual description.","src":"assets/new-image.jpg","alt":"Descriptive alt text for the image"}
```

### Add a video

Use MP4/H.264/AAC and keep the file below about 24 MB when possible:

```bash
cp /path/to/new-video.mp4 assets/new-video.mp4
ffprobe -v error -show_entries format=duration:stream=codec_name,width,height -of default=noprint_wrappers=1 assets/new-video.mp4
```

Add a poster image and this object inside `videos`:

```json
{"id":"new-video","title":"Project Video","description":"What the viewer will learn.","src":"assets/new-video.mp4","poster":"assets/new-video-poster.jpg"}
```

### Add a PDF

```bash
cp /path/to/new-document.pdf assets/documents/new-document.pdf
pdfinfo assets/documents/new-document.pdf
pdftoppm -f 1 -l 1 -jpeg -singlefile assets/documents/new-document.pdf assets/documents/new-document-cover
```

Add this object inside `documents`:

```json
{"id":"new-document","title":"Company Document","description":"What this document contains.","src":"assets/documents/new-document.pdf","cover":"assets/documents/new-document-cover.jpg"}
```

### Validate and publish

```bash
python3 -m json.tool content/media.json >/dev/null
git diff --check
git add assets content/media.json
git commit -m "Add new PKR media"
git push origin main
```

Wait for Cloudflare Pages to deploy, then check the website and asset URL. Do not put admin passwords or tokens into these files.

## 3. Check Google Search Console indexing and sitemap

1. Open [Google Search Console](https://search.google.com/search-console).
2. Add `https://pkr-website.pages.dev/` as a **URL-prefix property**.
3. Complete one offered verification method.
4. Open **Sitemaps**, enter `sitemap.xml`, and submit it.
5. Confirm the sitemap row shows **Success** and a recent “Last read” date. A success status means Google fetched the sitemap; it does not guarantee every URL is indexed.
6. Open **URL inspection**, enter `https://pkr-website.pages.dev/`, and inspect the result.
7. Check whether the URL is on Google, whether crawling/indexing is allowed, and the canonical Google selected.
8. Use **Request indexing** after a meaningful update. Do not submit repeatedly; Google says recrawling can take days to weeks and indexing is not guaranteed.
9. Open **Indexing → Pages** to review indexed, excluded, duplicate, blocked, and crawled-not-indexed URLs.
10. Confirm the live files directly:

```bash
curl -I https://pkr-website.pages.dev/
curl https://pkr-website.pages.dev/sitemap.xml
curl https://pkr-website.pages.dev/robots.txt
```

The current public files are:

- Sitemap: https://pkr-website.pages.dev/sitemap.xml
- Robots: https://pkr-website.pages.dev/robots.txt

Official Google references: [LocalBusiness structured data](https://developers.google.com/search/docs/appearance/structured-data/local-business), [Sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview), and [requesting recrawls](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl).
