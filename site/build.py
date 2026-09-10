#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
build.py — 静的サイト生成（依存: markdown のみ）

  python site/build.py            → site/dist/ に出力
  python site/build.py --check    → 生成せず検証のみ（tool.json 必須項目・related の存在・guide.md の見出し）

構成:
  site/config.json            サイト設定（名前・URL・広告/解析ID）
  site/tools/<slug>/          tool.json / body.html / script.js / guide.md   （TOOL_SPEC.md 参照）
  site/pages/<name>.md        固定ページ（先頭に "# タイトル"、2行目に "description: ..."）
  site/templates/base.html    共通レイアウト
  site/assets/                css / js / favicon
  site/data/affiliate_links.json  {"key": {"url": "...", "label": "..."}}   guide.md 内の {{aff:key}} を置換
"""
import argparse, datetime, html, json, os, re, shutil, sys

import markdown

sys.stdout.reconfigure(encoding="utf-8")
SITE = os.path.dirname(os.path.abspath(__file__))
DIST = os.path.join(SITE, "dist")


def read(p):
    with open(p, encoding="utf-8") as f:
        return f.read()


def write(p, s):
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, "w", encoding="utf-8", newline="\n") as f:
        f.write(s)


def render(tpl, **kw):
    return re.sub(r"\{\{(\w+)\}\}", lambda m: str(kw.get(m.group(1), "")), tpl)


def md(text, aff):
    text = re.sub(r"\{\{aff:(\w+)\}\}", lambda m: aff_link(aff, m.group(1)), text)
    return markdown.markdown(text, extensions=["tables", "fenced_code", "sane_lists"])


def aff_link(aff, key):
    a = aff.get(key)
    if not a or not a.get("url"):
        return ""
    return '<a href="%s" rel="sponsored noopener" target="_blank">%s</a>' % (html.escape(a["url"]), html.escape(a.get("label", key)))


def load_tools(cfg):
    tools = []
    tdir = os.path.join(SITE, "tools")
    for slug in sorted(os.listdir(tdir)):
        d = os.path.join(tdir, slug)
        if not os.path.isdir(d) or not os.path.exists(os.path.join(d, "tool.json")):
            continue
        meta = json.loads(read(os.path.join(d, "tool.json")))
        meta.setdefault("slug", slug)
        meta["_dir"] = d
        for k in ("title", "description", "category", "keywords"):
            if k not in meta:
                raise SystemExit(f"[{slug}] tool.json に {k} がない")
        if meta["category"] not in cfg["categories"]:
            raise SystemExit(f"[{slug}] category '{meta['category']}' は config.json に無い")
        for fn in ("body.html", "script.js", "guide.md"):
            if not os.path.exists(os.path.join(d, fn)):
                raise SystemExit(f"[{slug}] {fn} がない")
        tools.append(meta)
    return tools


def nav_html(cfg, root):
    return "".join('<a href="%stools/#%s">%s</a>' % (root, k, v) for k, v in cfg["categories"].items())


def card(t, root):
    return ('<li class="card"><span class="cat">%s</span><a class="t" href="%stools/%s/">%s</a><p>%s</p></li>'
            % (html.escape(t["_catname"]), root, t["slug"], html.escape(t["title"]), html.escape(t["description"][:80] + ("…" if len(t["description"]) > 80 else ""))))


def analytics_html(cfg):
    out = []
    if cfg.get("ga4_id"):
        g = cfg["ga4_id"]
        out.append('<script async src="https://www.googletagmanager.com/gtag/js?id=%s"></script>'
                   '<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag("js",new Date());gtag("config","%s");</script>' % (g, g))
    if cfg.get("cloudflare_analytics_token"):
        out.append('<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon=\'{"token": "%s"}\'></script>' % cfg["cloudflare_analytics_token"])
    return "\n".join(out)


def adsense_head(cfg):
    c = cfg.get("adsense_client")
    if not c:
        return ""
    return '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=%s" crossorigin="anonymous"></script>' % c


def ad_slot(cfg, slot_name):
    c = cfg.get("adsense_client")
    if not c:
        return '<div class="ad" data-slot="%s"></div>' % slot_name  # 未設定時は空枠（レイアウトを変えない）
    return ('<div class="ad"><ins class="adsbygoogle" style="display:block" data-ad-client="%s" data-ad-slot="%s" '
            'data-ad-format="auto" data-full-width-responsive="true"></ins><script>(adsbygoogle=window.adsbygoogle||[]).push({});</script></div>'
            % (c, cfg.get("adsense_slots", {}).get(slot_name, "")))


def tool_page(t, tools_by_slug, cfg, base, aff):
    root = "../../"
    url = f"{cfg['base_url']}/tools/{t['slug']}/"
    body = read(os.path.join(t["_dir"], "body.html"))
    guide = md(read(os.path.join(t["_dir"], "guide.md")), aff)
    related = [tools_by_slug[s] for s in t.get("related", []) if s in tools_by_slug]
    # 同カテゴリから補充（最大6）
    for o in tools_by_slug.values():
        if len(related) >= 6:
            break
        if o["slug"] != t["slug"] and o["category"] == t["category"] and o not in related:
            related.append(o)
    rel_html = "".join('<li><a href="../%s/">%s</a></li>' % (r["slug"], html.escape(r.get("short_title", r["title"]))) for r in related)
    faqs = re.findall(r"<h3>Q\.\s*(.*?)</h3>\s*<p>A\.\s*(.*?)</p>", guide, flags=re.S)
    jsonld = [{
        "@context": "https://schema.org", "@type": "SoftwareApplication", "name": t["title"],
        "applicationCategory": "UtilitiesApplication", "operatingSystem": "Web", "url": url,
        "description": t["description"], "offers": {"@type": "Offer", "price": "0", "priceCurrency": "JPY"},
        "inLanguage": "ja"}]
    if faqs:
        jsonld.append({"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
            {"@type": "Question", "name": re.sub("<[^>]+>", "", q), "acceptedAnswer": {"@type": "Answer", "text": re.sub("<[^>]+>", "", a)}} for q, a in faqs]})
    jsonld.append({"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": cfg["site_name"], "item": cfg["base_url"] + "/"},
        {"@type": "ListItem", "position": 2, "name": "ツール一覧", "item": cfg["base_url"] + "/tools/"},
        {"@type": "ListItem", "position": 3, "name": t["title"], "item": url}]})
    content = f"""
<h1>{html.escape(t['title'])}</h1>
<p class="lead">{html.escape(t['description'])}</p>
<section class="tool" id="tool">
{body}
</section>
{ad_slot(cfg, 'under_tool')}
<article class="guide">
{guide}
<h2>関連ツール</h2>
<ul class="related">{rel_html}</ul>
<p class="updated">最終更新: {html.escape(t.get('updated', ''))} · カテゴリ: <a href="../#{t['category']}">{html.escape(t['_catname'])}</a></p>
</article>
{ad_slot(cfg, 'bottom')}
"""
    page = render(base, page_title=f"{t['title']} | {cfg['site_name']}", description=t["description"], canonical=url,
                  site_name=cfg["site_name"], tagline=cfg["tagline"], root=root, nav=nav_html(cfg, root),
                  breadcrumb=f'<p class="breadcrumb"><a href="{root}">ホーム</a> › <a href="../">ツール一覧</a> › {html.escape(t["short_title"] if "short_title" in t else t["title"])}</p>',
                  content=content, jsonld="\n".join('<script type="application/ld+json">%s</script>' % json.dumps(j, ensure_ascii=False) for j in jsonld),
                  analytics=analytics_html(cfg), adsense_head=adsense_head(cfg), scripts='<script src="script.js"></script>')
    write(os.path.join(DIST, "tools", t["slug"], "index.html"), page)
    shutil.copy(os.path.join(t["_dir"], "script.js"), os.path.join(DIST, "tools", t["slug"], "script.js"))


def static_page(name, cfg, base, aff, tools):
    src = os.path.join(SITE, "pages", name + ".md")
    text = read(src)
    lines = text.split("\n")
    title = lines[0].lstrip("# ").strip()
    desc = ""
    if len(lines) > 1 and lines[1].startswith("description:"):
        desc = lines[1].split(":", 1)[1].strip()
        body_md = "\n".join(lines[2:])
    else:
        body_md = "\n".join(lines[1:])
    body_md = body_md.replace("{{tool_count}}", str(len(tools)))
    root = "../"
    url = f"{cfg['base_url']}/{name}/"
    content = f"<h1>{html.escape(title)}</h1>\n" + md(body_md, aff)
    page = render(base, page_title=f"{title} | {cfg['site_name']}", description=desc or title, canonical=url,
                  site_name=cfg["site_name"], tagline=cfg["tagline"], root=root, nav=nav_html(cfg, root),
                  breadcrumb=f'<p class="breadcrumb"><a href="{root}">ホーム</a> › {html.escape(title)}</p>',
                  content=content, jsonld="", analytics=analytics_html(cfg), adsense_head=adsense_head(cfg), scripts="")
    write(os.path.join(DIST, name, "index.html"), page)


def index_pages(tools, cfg, base):
    # ツール一覧（カテゴリ別）
    root = "../"
    sections = []
    for k, v in cfg["categories"].items():
        ts = [t for t in tools if t["category"] == k]
        if not ts:
            continue
        sections.append(f'<h2 id="{k}">{html.escape(v)}</h2>\n<ul class="cards">' + "".join(card(t, root) for t in ts) + "</ul>")
    content = f"<h1>ツール一覧（{len(tools)}件）</h1><p class=\"lead\">{html.escape(cfg['tagline'])}</p>\n" + "\n".join(sections)
    page = render(base, page_title=f"ツール一覧 | {cfg['site_name']}", description=f"{cfg['site_name']}の全ツール一覧。{cfg['tagline']}",
                  canonical=cfg["base_url"] + "/tools/", site_name=cfg["site_name"], tagline=cfg["tagline"], root=root, nav=nav_html(cfg, root),
                  breadcrumb=f'<p class="breadcrumb"><a href="{root}">ホーム</a> › ツール一覧</p>', content=content, jsonld="",
                  analytics=analytics_html(cfg), adsense_head=adsense_head(cfg), scripts="")
    write(os.path.join(DIST, "tools", "index.html"), page)
    # トップ
    root = "./"
    newest = sorted(tools, key=lambda t: t.get("updated", ""), reverse=True)[:12]
    content = (f"<h1>{html.escape(cfg['site_name'])}</h1><p class=\"lead\">{html.escape(cfg['tagline'])}</p>"
               f'<h2>ツール</h2><ul class="cards">' + "".join(card(t, root) for t in newest) + "</ul>"
               f'<p><a href="tools/">すべてのツールを見る（{len(tools)}件）→</a></p>')
    jsonld = {"@context": "https://schema.org", "@type": "WebSite", "name": cfg["site_name"], "url": cfg["base_url"] + "/", "inLanguage": "ja"}
    page = render(base, page_title=f"{cfg['site_name']} — {cfg['tagline'][:40]}", description=cfg["tagline"], canonical=cfg["base_url"] + "/",
                  site_name=cfg["site_name"], tagline=cfg["tagline"], root=root, nav=nav_html(cfg, root), breadcrumb="", content=content,
                  jsonld='<script type="application/ld+json">%s</script>' % json.dumps(jsonld, ensure_ascii=False),
                  analytics=analytics_html(cfg), adsense_head=adsense_head(cfg), scripts="")
    write(os.path.join(DIST, "index.html"), page)


def sitemap(tools, pages, cfg):
    today = datetime.date.today().isoformat()
    urls = [(cfg["base_url"] + "/", today, "1.0"), (cfg["base_url"] + "/tools/", today, "0.9")]
    urls += [(f"{cfg['base_url']}/tools/{t['slug']}/", t.get("updated", today), "0.8") for t in tools]
    urls += [(f"{cfg['base_url']}/{p}/", today, "0.3") for p in pages]
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "".join(
        f"  <url><loc>{html.escape(u)}</loc><lastmod>{d}</lastmod><priority>{p}</priority></url>\n" for u, d, p in urls) + "</urlset>\n"
    write(os.path.join(DIST, "sitemap.xml"), xml)
    write(os.path.join(DIST, "robots.txt"), f"User-agent: *\nAllow: /\nSitemap: {cfg['base_url']}/sitemap.xml\n")
    host = re.sub(r"^https?://", "", cfg["base_url"]).strip("/")
    if host and "localhost" not in host and "example.com" not in host:
        write(os.path.join(DIST, "CNAME"), host + "\n")  # GitHub Pages カスタムドメイン


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    a = ap.parse_args()
    cfg = json.loads(read(os.path.join(SITE, "config.json")))
    aff_path = os.path.join(SITE, "data", "affiliate_links.json")
    aff = json.loads(read(aff_path)) if os.path.exists(aff_path) else {}
    tools = load_tools(cfg)
    by = {t["slug"]: t for t in tools}
    for t in tools:
        t["_catname"] = cfg["categories"][t["category"]]
        for r in t.get("related", []):
            if r not in by:
                print(f"  note: [{t['slug']}] related '{r}' は未作成（無視）")
        g = read(os.path.join(t["_dir"], "guide.md"))
        for h in ("## 使い方", "## よくある質問"):
            if h not in g:
                print(f"  WARN: [{t['slug']}] guide.md に '{h}' がない")
    if a.check:
        print(f"check OK: {len(tools)} tools")
        return
    if os.path.exists(DIST):
        shutil.rmtree(DIST, ignore_errors=True)  # OneDrive/ロック中でも止めない（上書きで更新される）
    shutil.copytree(os.path.join(SITE, "assets"), os.path.join(DIST, "assets"), dirs_exist_ok=True)
    base = read(os.path.join(SITE, "templates", "base.html"))
    for t in tools:
        tool_page(t, by, cfg, base, aff)
    pages = [f[:-3] for f in sorted(os.listdir(os.path.join(SITE, "pages"))) if f.endswith(".md")]
    for p in pages:
        static_page(p, cfg, base, aff, tools)
    index_pages(tools, cfg, base)
    sitemap(tools, pages, cfg)
    print(f"built: {len(tools)} tools, {len(pages)} pages → {DIST}")


if __name__ == "__main__":
    main()
