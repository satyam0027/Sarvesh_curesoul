from __future__ import annotations

from datetime import date
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BASE_URL = "https://thesarveshmishra.com"
TODAY = date.today().isoformat()


def score_priority(rel_path: str) -> tuple[str, str]:
    if rel_path == "index.html":
        return "1.0", "weekly"
    if rel_path in {"writings.html", "blog.html"}:
        return "0.9", "weekly"
    if rel_path.startswith("blog-"):
        return "0.9", "weekly"
    if rel_path.startswith("writings/"):
        return "0.8", "monthly"
    if rel_path in {"about.html", "work.html"}:
        return "0.8", "monthly"
    if rel_path in {"media.html"}:
        return "0.7", "weekly"
    return "0.6", "monthly"


def include_html(path: Path) -> bool:
    if path.name in {"SEO_BLOG_TEMPLATE.html"}:
        return False
    if path.name.startswith("_"):
        return False
    if "node_modules" in path.parts:
        return False
    return True


def build_url(path: Path) -> str:
    rel = path.relative_to(ROOT).as_posix()
    if rel == "index.html":
        return f"{BASE_URL}/"
    return f"{BASE_URL}/{rel}"


def generate() -> str:
    html_files = sorted(
        [p for p in ROOT.rglob("*.html") if include_html(p)],
        key=lambda p: p.relative_to(ROOT).as_posix(),
    )
    lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for file_path in html_files:
        rel = file_path.relative_to(ROOT).as_posix()
        priority, changefreq = score_priority(rel)
        loc = build_url(file_path)
        lines.append(
            f"  <url><loc>{loc}</loc><lastmod>{TODAY}</lastmod><changefreq>{changefreq}</changefreq><priority>{priority}</priority></url>"
        )
    lines.append("</urlset>")
    return "\n".join(lines) + "\n"


def main() -> None:
    sitemap_path = ROOT / "sitemap.xml"
    sitemap_path.write_text(generate(), encoding="utf-8")
    print(f"Updated {sitemap_path}")


if __name__ == "__main__":
    main()
