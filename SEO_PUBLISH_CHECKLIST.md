# SEO Publish Checklist (Channel Blogs)

Use this every time you add a new episode blog.

1. Copy `SEO_BLOG_TEMPLATE.html` to `writings/your-slug-with-guest-name.html`.
2. Keep guest name in:
   - page title
   - H1
   - meta description
   - URL slug
   - JSON-LD `mentions`
3. Add 700+ words unique article content (avoid thin pages).
4. Add internal links:
   - to channel hub (`blog-sarvesh-mishra-show.html`, `blog-the-inner-wealth.html`, or `blog-the-urban-sannyasi.html`)
   - to `writings.html`
   - to one related article
5. Add this new blog card to the relevant channel page.
6. Regenerate sitemap:
   - `python scripts/generate_sitemap.py`
7. Submit indexing in Google Search Console:
   - URL inspection -> Request indexing
   - submit `https://thesarveshmishra.com/sitemap.xml` again

## Recommended guest blog title pattern

`Guest Name on [Problem/Topic] | Channel Name`

Examples:
- `Hemant Kaushik on Property Rights | The Sarvesh Mishra Show`
- `Anurag Rishi Day 2: Subconscious Patterns | The Inner Wealth`
- `Sant Namdev Teachings for Modern Life | The Urban Sannyasi`
