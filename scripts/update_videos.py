#!/usr/bin/env python3
"""
update_videos.py
=================
Atualiza os blocos de "vídeos recentes" em index.html (Home, 3 vídeos)
e agenda/index.html (Agenda, 6 vídeos) com os últimos vídeos do canal.

Este script NÃO roda no navegador do visitante do site — ele roda
apenas aqui, no GitHub Actions (veja
.github/workflows/update-videos.yml), uma vez por dia. O HTML que o
visitante recebe já vem com os cards prontos, sem nenhuma chamada de
rede feita pelo navegador.

Fonte: feed RSS público do YouTube, lido diretamente (sem passar por
proxy de terceiro — a restrição de CORS que exigia isso no navegador
não existe rodando em servidor). ID do canal lido de
assets/js/content.js (campo SITE.youtubeChannelId), pra continuar
tendo um único lugar pra editar isso.

Reescreve só o trecho entre os marcadores <!-- videos:start --> e
<!-- videos:end --> de cada arquivo-alvo — o resto do HTML nunca é
tocado. Se os marcadores não forem encontrados, ou se o feed falhar,
o script não altera nada (ver main()).

Uso manual (opcional, no seu computador):
    python3 scripts/update_videos.py
"""

import html
import os
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET

BASE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
CONTENT_JS_PATH = os.path.join(BASE_DIR, "assets", "js", "content.js")

TARGETS = [
    (os.path.join(BASE_DIR, "index.html"), 3),
    (os.path.join(BASE_DIR, "agenda", "index.html"), 6),
]

MARKER_START = "<!-- videos:start -->"
MARKER_END = "<!-- videos:end -->"
MARKER_PATTERN = re.compile(re.escape(MARKER_START) + r".*?" + re.escape(MARKER_END), re.S)

NS = {
    "atom": "http://www.w3.org/2005/Atom",
    "yt": "http://www.youtube.com/xml/schemas/2015",
}


def read_channel_id():
    with open(CONTENT_JS_PATH, "r", encoding="utf-8") as f:
        content = f.read()
    m = re.search(r'youtubeChannelId:\s*"([^"]*)"', content)
    return m.group(1).strip() if m else ""


def fetch_videos(channel_id, limit):
    feed_url = f"https://www.youtube.com/feeds/videos.xml?channel_id={channel_id}"
    req = urllib.request.Request(feed_url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=20) as resp:
        data = resp.read()

    root = ET.fromstring(data)
    videos = []
    for entry in root.findall("atom:entry", NS)[:limit]:
        video_id = entry.findtext("yt:videoId", default="", namespaces=NS)
        titulo = entry.findtext("atom:title", default="", namespaces=NS)
        link_el = entry.find("atom:link", NS)
        url = link_el.get("href") if link_el is not None else ""
        thumb = f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg" if video_id else ""
        if titulo and url:
            videos.append({"titulo": titulo, "url": url, "thumb": thumb})
    return videos


def render_cards(videos):
    cards = []
    for v in videos:
        titulo = html.escape(v["titulo"])
        thumb_html = f'<img src="{v["thumb"]}" alt="" loading="lazy">' if v["thumb"] else "▶"
        cards.append(
            f'<a class="card video-card" href="{v["url"]}" target="_blank" rel="noopener">'
            f'<div class="video-thumb">{thumb_html}</div>'
            f'<div class="video-title">{titulo}</div>'
            f"</a>"
        )
    return "\n      ".join(cards)


def update_file(path, videos):
    with open(path, "r", encoding="utf-8") as f:
        original = f.read()

    if MARKER_PATTERN.search(original) is None:
        print(f"AVISO: marcadores não encontrados em {path} — pulando.", file=sys.stderr)
        return False

    replacement = f"{MARKER_START}\n      {render_cards(videos)}\n      {MARKER_END}"
    updated = MARKER_PATTERN.sub(replacement, original, count=1)

    if updated == original:
        return False

    with open(path, "w", encoding="utf-8") as f:
        f.write(updated)
    return True


def main():
    channel_id = read_channel_id()
    if not channel_id:
        print("SITE.youtubeChannelId vazio ou não encontrado em content.js — abortando.", file=sys.stderr)
        sys.exit(1)

    try:
        videos = fetch_videos(channel_id, limit=6)
    except Exception as e:
        print(f"Falha ao buscar o feed do YouTube: {e}", file=sys.stderr)
        sys.exit(1)

    if not videos:
        print("Feed retornou sem vídeos utilizáveis — nada a atualizar.")
        return

    changed_any = False
    for path, limit in TARGETS:
        if update_file(path, videos[:limit]):
            print(f"Atualizado: {path}")
            changed_any = True

    if not changed_any:
        print("Nenhuma mudança (conteúdo já estava atualizado).")


if __name__ == "__main__":
    main()
