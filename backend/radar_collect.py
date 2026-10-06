"""Public ENEM signals, collected concurrently without an AI API or server.

Run: python3 backend/radar_collect.py
The browser downloads the published JSON; GitHub Actions performs collection.
"""
from __future__ import annotations

import hashlib
import json
import re
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from html import unescape
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LIMIT = 2_000_000
CONFIG = json.loads((ROOT / "backend/sources.json").read_text())


def normalize(value: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", value.lower()) if unicodedata.category(c) != "Mn")


def classify(value: str) -> list[str]:
    normalized = normalize(value)
    return [topic["id"] for topic in CONFIG["topics"] if any(normalize(word) in normalized for word in topic["keywords"])]


def safe_url(value: str) -> str:
    try:
        parsed = urllib.parse.urlsplit(value.strip())
        if parsed.scheme not in ("http", "https") or not parsed.hostname or parsed.username or parsed.password:
            return ""
        return urllib.parse.urlunsplit((parsed.scheme, parsed.netloc, parsed.path, parsed.query, ""))[:2000]
    except ValueError:
        return ""


def date_only(value: str) -> str | None:
    try:
        match = re.match(r"^\d{4}-\d{2}-\d{2}", value)
        if match:
            datetime.strptime(match[0], "%Y-%m-%d")
            return match[0]
        return parsedate_to_datetime(value).astimezone(timezone.utc).date().isoformat()
    except (TypeError, ValueError, OverflowError):
        return None


class Page(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.text: list[str] = []
        self.title: list[str] = []
        self.links: list[tuple[str, str]] = []
        self.published = ""
        self.skip = 0
        self.heading = False
        self.link = ""
        self.link_text: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        if tag in ("script", "style", "nav", "footer", "header"):
            self.skip += 1
        if tag == "h1":
            self.heading = True
        if tag == "meta" and values.get("property", values.get("name")) in ("article:published_time", "date", "datePublished"):
            self.published = values.get("content") or ""
        if tag == "a":
            self.link = values.get("href") or ""
            self.link_text = []

    def handle_endtag(self, tag: str) -> None:
        if tag in ("script", "style", "nav", "footer", "header"):
            self.skip = max(0, self.skip - 1)
        if tag == "h1":
            self.heading = False
        if tag == "a" and self.link:
            self.links.append((self.link, " ".join(self.link_text).strip()))
            self.link = ""

    def handle_data(self, data: str) -> None:
        value = data.strip()
        if value and not self.skip:
            self.text.append(value)
            if self.heading:
                self.title.append(value)
            if self.link:
                self.link_text.append(value)


def record(source: dict, title: str, url: str, excerpt: str, published: str, observed: str) -> dict | None:
    url = safe_url(url)
    themes = classify(title + " " + excerpt[:16000])
    if not url or not title or not themes:
        return None
    template = source.get("template") or {}
    return {
        "id": template.get("id") or "public-" + hashlib.sha256(url.encode()).hexdigest()[:20],
        "title": title[:280], "url": url, "source": source["title"],
        "kind": source.get("kind", "news"),
        "date": date_only(published) or template.get("date"), "observedAt": observed,
        "topics": themes, "origin": "collected",
        "note": "Fonte pública consultada pelo script Python. Classificação por palavras-chave; confira o contexto na origem. Não é previsão do tema do ENEM.",
    }


def rss(body: str, source: dict, observed: str) -> list[dict]:
    if "<!DOCTYPE" in body.upper() or "<!ENTITY" in body.upper():
        raise ValueError("Declarações externas não são aceitas no feed")
    tree = ET.fromstring(body)
    articles = []
    for node in list(tree.iter())[:10000]:
        if node.tag.split("}")[-1] not in ("item", "entry"):
            continue
        fields = {child.tag.split("}")[-1]: child for child in node}
        def field(*names: str) -> str:
            for name in names:
                if name in fields:
                    return "".join(fields[name].itertext()).strip()
            return ""
        link = field("link")
        if not link and "link" in fields:
            link = fields["link"].attrib.get("href", "")
        title = unescape(re.sub(r"<[^>]+>", " ", field("title"))).strip()
        summary = unescape(re.sub(r"<[^>]+>", " ", field("description", "summary", "content")))[:650]
        article = record(source, title, link, summary, field("pubDate", "published", "updated"), observed)
        if article:
            articles.append(article)
        if len(articles) >= 100:
            break
    return articles


def collect_source(source: dict, observed: str) -> tuple[list[dict], dict]:
    status = {"id": source["id"], "title": source["title"], "url": source["url"], "ok": False, "count": 0, "message": ""}
    try:
        request = urllib.request.Request(source["url"], headers={"User-Agent": "ATENA/5.0 (open educational source aggregator)", "Accept": "text/html,application/rss+xml,application/xml;q=0.9"})
        with urllib.request.urlopen(request, timeout=12) as response:
            if int(response.headers.get("Content-Length", "0")) > LIMIT:
                raise ValueError("Resposta grande demais")
            raw = response.read(LIMIT + 1)
            if len(raw) > LIMIT:
                raise ValueError("Resposta grande demais")
            body = raw.decode(response.headers.get_content_charset() or "utf-8", errors="replace")
        if source["format"] == "rss":
            articles = rss(body, source, observed)
        else:
            page = Page()
            page.feed(body)
            if source["format"] == "listing":
                articles = []
                for link, title in page.links:
                    url = urllib.parse.urljoin(source["url"], link)
                    if len(title) < 30 or urllib.parse.urlsplit(url).hostname != urllib.parse.urlsplit(source["url"]).hostname:
                        continue
                    article = record(source, title, url, "", "", observed)
                    if article:
                        articles.append(article)
                    if len(articles) >= 30:
                        break
            else:
                template = source.get("template") or {}
                text = " ".join(page.text)
                if len(text) < 400:
                    raise ValueError("Conteúdo esperado não encontrado")
                article = record(source, " ".join(page.title) or template.get("title", source["title"]), source["url"], text, page.published, observed)
                articles = [article] if article else []
        status.update(ok=True, count=len(articles), message="Consulta concluída" if articles else "Consulta concluída, sem temas compatíveis")
        return articles, status
    except (urllib.error.URLError, TimeoutError, OSError, ValueError, ET.ParseError) as error:
        status["message"] = "Não foi possível consultar a fonte: " + str(error)[:150]
        return [], status


def merge_articles(previous: list[dict], collected: list[dict]) -> list[dict]:
    articles = {}
    for article in previous + collected:
        url = safe_url(article.get("url", ""))
        if url:
            articles[url] = article
    return sorted(articles.values(), key=lambda item: (item.get("observedAt") or "", item.get("date") or ""), reverse=True)[:500]


def main() -> None:
    fetched = datetime.now(timezone.utc).isoformat()
    sources = CONFIG["sources"]
    with ThreadPoolExecutor(max_workers=4) as pool:
        results = list(pool.map(lambda source: collect_source(source, fetched[:10]), sources))
    destination = ROOT / "portable/public/data/latest.json"
    previous = json.loads(destination.read_text()) if destination.exists() else {"articles": []}
    collected_articles = []
    for collected, status in results:
        for article in collected:
            collected_articles.append(article)
        print(("OK" if status["ok"] else "FALHA"), status["title"], status["count"], flush=True)
    if not any(status["ok"] for _, status in results):
        raise SystemExit("Nenhuma fonte respondeu. O arquivo publicado foi preservado.")
    articles = merge_articles(previous.get("articles", []), collected_articles)
    result = {"fetchedAt": fetched, "articles": articles, "statuses": [status for _, status in results]}
    temporary = destination.with_suffix(".tmp")
    temporary.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
    temporary.replace(destination)
    print("Base pública atualizada:", len(result["articles"]), "registros. Sem IA ou banco de dados.")


if __name__ == "__main__":
    main()
