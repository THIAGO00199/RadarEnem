import unittest
from unittest.mock import patch
from urllib.error import URLError
from backend.radar_collect import Page, classify, collect_source, date_only, merge_articles, rss, safe_url


class CollectorTests(unittest.TestCase):
    source = {"id": "test", "title": "Fonte pública", "url": "https://example.org/feed", "format": "rss", "kind": "news"}

    def test_unicode_keywords_and_dates(self):
        self.assertTrue(classify("desafios da educação no Brasil e inteligência artificial"))
        self.assertEqual(date_only("2026-10-05T20:00:00Z"), "2026-10-05")
        self.assertEqual(date_only("Mon, 05 Oct 2026 20:00:00 GMT"), "2026-10-05")
        self.assertIsNone(date_only("2026-02-30"))

    def test_urls(self):
        for url in ["javascript:alert(1)", "data:text/html,teste", "https://user:secret@example.org/"]:
            self.assertEqual(safe_url(url), "")
        self.assertEqual(safe_url("https://example.org/educacao#parte"), "https://example.org/educacao")

    def test_rss_and_atom(self):
        items = rss('<rss><channel><item><title>Educação e inclusão digital</title><link>https://example.org/artigo</link><description>Inteligência artificial na escola</description><pubDate>Mon, 05 Oct 2026 20:00:00 GMT</pubDate></item></channel></rss>', self.source, "2026-10-06")
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["date"], "2026-10-05")
        self.assertTrue(items[0]["topics"])
        atom = rss('<feed xmlns="http://www.w3.org/2005/Atom"><entry><title>Educação e inclusão digital</title><link href="https://example.org/atom"/><updated>2026-10-05T20:00:00Z</updated></entry></feed>', self.source, "2026-10-06")
        self.assertEqual(atom[0]["url"], "https://example.org/atom")
        with self.assertRaises(ValueError):
            rss('<!DOCTYPE rss [<!ENTITY x "teste">]><rss/>', self.source, "2026-10-06")

    def test_html_ignores_non_content(self):
        page = Page()
        page.feed('<nav>Menu irrelevante</nav><script>segredo</script><h1>Educação</h1><p>Um contexto</p><a href="/noticia">Educação no Brasil</a>')
        self.assertEqual(page.title, ["Educação"])
        self.assertNotIn("segredo", page.text)
        self.assertEqual(page.links, [("/noticia", "Educação no Brasil")])

    def test_outage_preserves_old_records_and_limits_keep_newest(self):
        old = [{"url": f"https://example.org/{n}", "observedAt": "2026-01-01", "title": "Anterior"} for n in range(500)]
        new = {"url": "https://example.org/novo", "observedAt": "2026-10-06", "title": "Novo"}
        merged = merge_articles(old, [new])
        self.assertEqual(len(merged), 500)
        self.assertEqual(merged[0]["title"], "Novo")
        self.assertEqual(merge_articles(old[:2], []), old[:2])
        with patch('backend.radar_collect.urllib.request.urlopen', side_effect=URLError("Fonte indisponível")):
            items, status = collect_source(self.source, "2026-10-06")
        self.assertEqual(items, [])
        self.assertFalse(status["ok"])


if __name__ == '__main__':
    unittest.main()
