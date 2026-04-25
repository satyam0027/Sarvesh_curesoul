# Episode Blog Publishing Playbook

This workflow helps you publish every new episode blog for both channels:

- `The Inner Wealth` (guest-based 7-day series)
- `The Sarvesh Mishra Show` (episode-by-episode)

## 1) Gather inputs first

- YouTube URL
- Transcript (raw text is fine)
- Guest name
- Episode number or day number
- Channel name
- Primary keywords (guest + topic)

## 2) Pull YouTube metadata (title + thumbnail)

Use oEmbed:

- `https://www.youtube.com/oembed?url=<YOUTUBE_URL>&format=json`

Take:

- `title` -> use exact in H1 and card title
- `thumbnail_url` or `https://i.ytimg.com/vi/<VIDEO_ID>/maxresdefault.jpg`
- fallback -> `https://i.ytimg.com/vi/<VIDEO_ID>/hqdefault.jpg`

## 3) Channel-specific publishing flow

### A) The Inner Wealth

1. Update `blog-the-inner-wealth.html` (guest card)
2. Update/create guest hub: `inner-wealth-series-<guest>.html`
3. Add day page: `writings/inner-wealth-<guest>-day-<n>.html`
4. Link day card -> day blog page

### B) The Sarvesh Mishra Show

1. Update `blog-sarvesh-mishra-show.html` (new episode card)
2. Add blog page: `writings/the-sarvesh-mishra-show-<guest>-<topic>.html`

## 4) SEO checklist (mandatory per blog page)

- Unique `<title>`
- `<meta name="description">`
- `<meta name="keywords">`
- `<link rel="canonical">`
- Open Graph tags
- Twitter tags
- JSON-LD:
  - `Article`
  - `VideoObject`
  - `FAQPage`
  - `BreadcrumbList` (recommended)

## 5) Recommended content structure

1. Intro + exact YouTube title
2. Embedded video
3. Quick summary bullets
4. Detailed transcript-based sections
5. Actionable takeaways
6. CTA to video + back links

## 6) Internal links (always keep both-way links)

Each new blog should link to:

- its channel hub page
- `writings.html`
- its series hub (for Inner Wealth)

Each hub should link forward to the newly created blog.

## 7) Naming convention

Use lowercase and hyphens only.

Examples:

- `writings/inner-wealth-shivam-yogi-day-2.html`
- `writings/the-sarvesh-mishra-show-guest-topic.html`

## 8) Pre-publish QA

- [ ] Title/H1 matches YouTube title
- [ ] Card thumbnail loads (maxres + fallback)
- [ ] Canonical URL correct
- [ ] JSON-LD valid
- [ ] Mobile responsive check
- [ ] Hub -> blog -> hub links working

## 9) Reusable template trick

Keep one starter HTML template for each channel and only replace:

- title/meta/JSON-LD
- video ID
- guest/day fields
- transcript-based body

This keeps output fast, consistent, and SEO-safe.
