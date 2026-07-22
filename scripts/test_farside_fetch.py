#!/usr/bin/env python3
"""
test_farside_fetch.py — TEMPORÁRIO, só para diagnóstico.
==========================================================
Etapa 3: comparando a página resumo (/btc/) com a página de histórico
completo (/bitcoin-etf-flow-all-data/) — o usuário observou que esta
segunda parece ter uma estrutura mais simples e já trazer o histórico
inteiro, exatamente o formato que o produto precisa. Este script busca
essa página (mesmos headers de navegador já validados) e imprime a
estrutura real da tabela de tickers, sem presumir nada a partir do
print visual — só o HTML bruto conta.

Não salva nada, não commita nada. Este arquivo e o workflow
.github/workflows/test-farside-fetch.yml são temporários.
"""
import html.parser
import re
import sys
import urllib.error
import urllib.request
import gzip

TARGET_URL = "https://farside.co.uk/bitcoin-etf-flow-all-data/"

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


def fetch(url):
    req = urllib.request.Request(url, headers=BROWSER_HEADERS)
    with urllib.request.urlopen(req, timeout=30) as resp:
        status = resp.status
        final_url = resp.geturl()
        raw = resp.read()
        headers = dict(resp.headers.items())
    if (headers.get("Content-Encoding") or "").lower() == "gzip":
        raw = gzip.decompress(raw)
    return status, final_url, raw.decode("utf-8", errors="replace")


def main():
    print(f"GET {TARGET_URL}")
    try:
        status, final_url, html_text = fetch(TARGET_URL)
    except urllib.error.HTTPError as e:
        print(f"[FALHA NO GET] HTTP {e.code}: {e.reason}")
        sys.exit(1)
    except Exception as e:
        print(f"[FALHA NO GET] {type(e).__name__}: {e}")
        sys.exit(1)

    print(f"Status: {status}  |  URL final: {final_url}")
    print(f"Tamanho total da página: {len(html_text)} caracteres")

    group_parser = _TableGroupParser()
    group_parser.feed(html_text)
    print(f"Total de <table> encontradas: {len(group_parser.tables)}")
    for i, table in enumerate(group_parser.tables):
        print(f"  tabela {i}: {len(table)} linha(s)")

    target_idx = None
    for i, table in enumerate(group_parser.tables):
        flat = " | ".join(" ".join(row) for row in table)
        if "IBIT" in flat:
            target_idx = i
            break

    if target_idx is None:
        print("[NÃO ENCONTRADO] Nenhuma das tabelas contém o texto 'IBIT'.")
        sys.exit(1)

    table = group_parser.tables[target_idx]
    print(f"\nTabela {target_idx} (de {len(group_parser.tables)}) contém os tickers dos ETFs.")
    print(f"Quantidade de linhas nessa tabela: {len(table)}")

    print("\nCabeçalho (linha 0):")
    print(f"  {table[0]}")
    if len(table) > 1:
        print("Segunda linha (para checar se o cabeçalho tem 1 ou 2 linhas):")
        print(f"  {table[1]}")

    print("\nPrimeiras 3 linhas após o cabeçalho:")
    for row in table[1:4]:
        print(f"  {row}")

    print("\nÚltimas 3 linhas da tabela:")
    for row in table[-3:]:
        print(f"  {row}")

    print(f"\nTotal de linhas nesta tabela: {len(table)} (esperado: ~1 cabeçalho + 1 dia por linha desde 11 Jan 2024)")


if __name__ == "__main__":
    main()
