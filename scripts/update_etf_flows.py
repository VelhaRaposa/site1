#!/usr/bin/env python3
"""
update_etf_flows.py
====================
Atualiza assets/data/etf-flows-daily.json e assets/data/etf-flows-summary.json
com os fluxos diários (US$ milhões) dos ETFs spot de Bitcoin dos EUA.

Fonte única: https://farside.co.uk/btc/ — nenhuma outra fonte entra aqui
(sem holdings, sem AUM, sem scraping de emissor individual). Ver README,
seção ETF Flows.

O QUE ESTE SCRIPT NÃO FAZ:
Não recalcula o "Total" acumulado por ETF nem o "Total" por data — a
própria tabela da Farside já publica os dois prontos (linha-resumo
"Total" no rodapé da tabela = acumulado por ETF; coluna "Total" em cada
linha de data = soma de todos os ETFs naquele dia). Este script só lê e
guarda o que a fonte já calculou, sem reinterpretar.

FORMATO DOS ARQUIVOS:
- etf-flows-daily.json: array append-only, 1 objeto por data já
  publicada pela Farside, nunca reescreve uma data já existente.
  [{"date": "2026-07-21", "flows": {"IBIT": 163.9, ..., "TOTAL": 203.2}}]
- etf-flows-summary.json: snapshot (sobrescrito a cada execução, não é
  histórico) com o acumulado atual por ETF, a lista de tickers na ordem
  em que a Farside os publica, e o horário da última coleta.
  {"totals": {"IBIT": 60770.0, ..., "TOTAL": 51835.0},
   "tickers": ["IBIT", "FBTC", ...],
   "last_date": "2026-07-21", "collected_at": "2026-...Z"}

Este script roda só no GitHub Actions (.github/workflows/update-etf-flows.yml),
nunca no navegador do visitante.
"""
import html.parser
import json
import os
import re
import sys
import urllib.request
from datetime import datetime, timezone

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "data")
DAILY_PATH = os.path.join(DATA_DIR, "etf-flows-daily.json")
SUMMARY_PATH = os.path.join(DATA_DIR, "etf-flows-summary.json")
URL = "https://farside.co.uk/btc/"

SUMMARY_LABELS = {"total", "average", "maximum", "minimum"}
MONTH_ABBR = {
    "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
    "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12,
}
DATE_RE = re.compile(r"^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$")


class _TableParser(html.parser.HTMLParser):
    """Extrai todas as linhas/células de texto de todas as <table> da
    página, na ordem em que aparecem. Não assume nenhuma classe/id
    específico — a Farside pode redesenhar a página sem aviso, e este
    parser só depende da estrutura genérica table/tr/td/th."""

    def __init__(self):
        super().__init__()
        self.rows = []
        self._in_table = False
        self._in_cell = False
        self._row = None
        self._cell_text = []

    def handle_starttag(self, tag, attrs):
        if tag == "table":
            self._in_table = True
        elif tag == "tr" and self._in_table:
            self._row = []
        elif tag in ("td", "th") and self._in_table:
            self._in_cell = True
            self._cell_text = []

    def handle_endtag(self, tag):
        if tag == "table":
            self._in_table = False
        elif tag == "tr" and self._row is not None:
            self.rows.append(self._row)
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


def _parse_value(cell):
    """'163.9' -> 163.9 | '(45.4)' -> -45.4 | '-' / '' -> None (sem dado,
    NUNCA vira 0 — dia sem dado é diferente de fluxo zero)."""
    cell = cell.strip().replace(",", "")
    if cell in ("", "-", "—"):
        return None
    neg = cell.startswith("(") and cell.endswith(")")
    if neg:
        cell = cell[1:-1]
    try:
        value = float(cell)
    except ValueError:
        return None
    return -value if neg else value


def _parse_date(cell):
    m = DATE_RE.match(cell.strip())
    if not m:
        return None
    day, mon_abbr, year = m.groups()
    month = MONTH_ABBR.get(mon_abbr.lower())
    if not month:
        return None
    try:
        return datetime(int(year), month, int(day)).strftime("%Y-%m-%d")
    except ValueError:
        return None


def fetch_html():
    req = urllib.request.Request(URL, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode("utf-8", errors="replace")


def extract(html_text):
    """Retorna (tickers, daily_rows, totals) a partir do HTML bruto.
    daily_rows: lista de {"date": ..., "flows": {ticker: valor_ou_None}}
    totals: {ticker: valor_acumulado} (linha-resumo "Total" da própria Farside)
    """
    parser = _TableParser()
    parser.feed(html_text)

    header_row = None
    header_idx = None
    for idx, row in enumerate(parser.rows):
        # linha de cabeçalho real: >=3 células curtas em maiúsculas e a
        # última célula é "Total" — não depende de posição fixa na página.
        if len(row) < 3:
            continue
        if row[-1].strip().lower() != "total":
            continue
        candidatos = [c for c in row[:-1] if re.fullmatch(r"[A-Z]{2,6}", c.strip())]
        if len(candidatos) >= 3:
            header_row = row
            header_idx = idx
            break

    if header_row is None:
        raise RuntimeError(
            "Não encontrei a linha de cabeçalho (tickers + 'Total') no HTML. "
            f"Total de linhas de tabela encontradas: {len(parser.rows)}. "
            "A Farside provavelmente mudou o layout da página — inspecionar "
            "o HTML bruto manualmente antes de ajustar este parser."
        )

    # a linha de cabeçalho real da Farside tem uma célula vazia na
    # primeira posição (a coluna onde as datas aparecem não tem título) —
    # filtrar células em branco em vez de assumir uma posição fixa, pra
    # não depender de quantas colunas "decorativas" existem antes do
    # primeiro ticker.
    tickers = [c.strip() for c in header_row[:-1] if c.strip()]

    daily_rows = []
    totals = {}
    for row in parser.rows[header_idx + 1:]:
        if not row:
            continue
        label = row[0].strip()
        if label.lower() in SUMMARY_LABELS:
            if label.lower() == "total" and not totals:
                values = row[1:]
                for i, ticker in enumerate(tickers):
                    if i < len(values):
                        totals[ticker] = _parse_value(values[i])
                # última célula da linha "Total" = acumulado geral (todos os
                # ETFs, todo o período) — é o número de destaque do rodapé.
                if len(values) > len(tickers):
                    totals["TOTAL"] = _parse_value(values[len(tickers)])
            continue

        date_iso = _parse_date(label)
        if date_iso is None:
            continue  # linha que não é nem data nem resumo conhecido — ignora

        values = row[1:]
        flows = {}
        for i, ticker in enumerate(tickers):
            flows[ticker] = _parse_value(values[i]) if i < len(values) else None
        # última célula de cada linha de data = coluna "Total" da própria
        # Farside (soma de todos os ETFs naquele dia) — guardada com a
        # chave "TOTAL" para não colidir com nenhum ticker real.
        if len(values) > len(tickers):
            flows["TOTAL"] = _parse_value(values[len(tickers)])
        daily_rows.append({"date": date_iso, "flows": flows})

    if not daily_rows:
        raise RuntimeError(
            "Cabeçalho encontrado, mas nenhuma linha de data foi reconhecida. "
            "Formato de data pode ter mudado (esperado: 'DD Mon YYYY', ex. '21 Jul 2026')."
        )
    if not totals:
        raise RuntimeError("Linha-resumo 'Total' (acumulado por ETF) não encontrada.")

    return tickers, daily_rows, totals


def load_daily():
    try:
        with open(DAILY_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return []


def save_json(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, separators=(",", ":"))


def main():
    try:
        html_text = fetch_html()
    except Exception as e:
        print(f"[FALHA] Não consegui buscar {URL}: {e}")
        sys.exit(1)

    try:
        tickers, new_rows, totals = extract(html_text)
    except Exception as e:
        # Em caso de falha de parsing, imprime uma amostra do HTML bruto
        # no log do Actions — é o diagnóstico real, não uma suposição.
        print(f"[FALHA] Erro ao interpretar a tabela da Farside: {e}")
        print("----- amostra do HTML recebido (primeiros 2000 caracteres) -----")
        print(html_text[:2000])
        sys.exit(1)

    daily = load_daily()
    existing_dates = {row["date"] for row in daily}
    added = 0
    for row in new_rows:
        if row["date"] in existing_dates:
            continue
        daily.append(row)
        existing_dates.add(row["date"])
        added += 1

    daily.sort(key=lambda row: row["date"])
    save_json(DAILY_PATH, daily)

    summary = {
        "tickers": tickers,
        "totals": totals,
        "last_date": daily[-1]["date"] if daily else None,
        "collected_at": datetime.now(timezone.utc).isoformat(),
    }
    save_json(SUMMARY_PATH, summary)

    print(f"OK: {added} dia(s) novo(s) adicionados. Último dia: {summary['last_date']}. "
          f"Tickers: {', '.join(tickers)}.")


if __name__ == "__main__":
    main()
