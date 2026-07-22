#!/usr/bin/env python3
"""
test_farside_fetch.py — TEMPORÁRIO, só para diagnóstico.
==========================================================
Etapa 2: já sabemos que farside.co.uk responde 200 com headers de
navegador comum (Categoria A — coletável, confirmado). Este script
agora localiza, entre todas as <table> da página, qual delas contém
os tickers dos ETFs, e imprime o conteúdo bruto só dessa tabela —
para corrigir o parser contra a estrutura real, não a presumida.

Não salva nada, não commita nada. Este arquivo e o workflow
.github/workflows/test-farside-fetch.yml são temporários.
"""
import html.parser
import re
import sys
import urllib.error
import urllib.request
import gzip

sys.path.insert(0, __file__.rsplit("/", 1)[0])
from update_etf_flows import URL

BROWSER_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Cache-Control": "max-age=0",
}


class _TableGroupParser(html.parser.HTMLParser):
    """Agrupa as linhas por tabela (lista de tabelas, cada uma com sua
    própria lista de linhas) — só para identificar qual das N tabelas
    da página é a tabela real de fluxos."""

    def __init__(self):
        super().__init__()
        self.tables = []
        self._current_table = None
        self._row = None
        self._in_cell = False
        self._cell_text = []

    def handle_starttag(self, tag, attrs):
        if tag == "table":
            self._current_table = []
            self.tables.append(self._current_table)
        elif tag == "tr" and self._current_table is not None:
            self._row = []
        elif tag in ("td", "th") and self._current_table is not None:
            self._in_cell = True
            self._cell_text = []

    def handle_endtag(self, tag):
        if tag == "table":
            self._current_table = None
        elif tag == "tr" and self._row is not None:
            self._current_table.append(self._row)
            self._row = None
        elif tag in ("td", "th") and self._in_cell:
            text = "".join(self._cell_text).strip()
            text = re.sub(r"\s+", " ", text)
            if self._row is not None:
                self._row.append(text)
            self._in_cell = False

    def handle_data(self, data):
        if self._in_cell:
            self._cell_text.append(data)


def fetch():
    req = urllib.request.Request(URL, headers=BROWSER_HEADERS)
    with urllib.request.urlopen(req, timeout=30) as resp:
        raw = resp.read()
        headers = dict(resp.headers.items())
    if (headers.get("Content-Encoding") or "").lower() == "gzip":
        raw = gzip.decompress(raw)
    return raw.decode("utf-8", errors="replace")


def main():
    try:
        html_text = fetch()
    except Exception as e:
        print(f"[FALHA NO GET] {type(e).__name__}: {e}")
        sys.exit(1)

    print(f"Tamanho total da página: {len(html_text)} caracteres")

    group_parser = _TableGroupParser()
    group_parser.feed(html_text)
    print(f"Total de <table> encontradas: {len(group_parser.tables)}")

    target_idx = None
    for i, table in enumerate(group_parser.tables):
        flat = " | ".join(" ".join(row) for row in table)
        if "IBIT" in flat:
            target_idx = i
            break

    if target_idx is None:
        print("[NÃO ENCONTRADO] Nenhuma das tabelas contém o texto 'IBIT'.")
        print("Listando um resumo de cada tabela encontrada (nº de linhas e primeira linha):")
        for i, table in enumerate(group_parser.tables):
            primeira = table[0] if table else []
            print(f"  tabela {i}: {len(table)} linha(s) — primeira linha: {primeira}")
        sys.exit(1)

    table = group_parser.tables[target_idx]
    print(f"\nTabela {target_idx} (de {len(group_parser.tables)}) contém os tickers dos ETFs.")
    print(f"Quantidade de linhas nessa tabela: {len(table)}")
    print("\nHTML BRUTO (todas as linhas dessa tabela, uma por linha de log):")
    print("-" * 70)
    for i, row in enumerate(table):
        marca = ""
        if i == 0:
            marca = "  <-- primeira linha da tabela"
        if i == len(table) - 1:
            marca = "  <-- última linha da tabela"
        print(f"[{i:02d}] {row}{marca}")
    print("-" * 70)


if __name__ == "__main__":
    main()
