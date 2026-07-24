#!/usr/bin/env python3
"""
update_etf_flows.py
====================
Atualiza assets/data/etf-flows-daily.json e assets/data/etf-flows-summary.json
com os fluxos diários (US$ milhões) dos ETFs spot de Bitcoin dos EUA.

Fonte única: https://farside.co.uk/bitcoin-etf-flow-all-data/ — nenhuma
outra fonte entra aqui (sem holdings, sem AUM, sem scraping de emissor
individual). Ver README, seção ETF Flows.

Por que esta página e não farside.co.uk/btc/: a página resumo (/btc/)
só mostra uma janela recente de dias e mistura linhas extras (Fee,
Average, Maximum, Minimum) com a tabela de fluxos. Esta página ("All
Data") tem o histórico completo desde 11/jan/2024, uma linha por dia,
e só uma linha de resumo ("Total") — estrutura mais simples e mais
alinhada ao que o produto precisa (confirmado via diagnóstico real
contra as duas páginas, não por suposição).

IMPORTANTE — headers de requisição: farside.co.uk fica atrás de
Cloudflare, que devolve 403 (challenge JS) para requisições com
headers mínimos (ex.: só User-Agent). Confirmado em teste real que
enviar um conjunto de headers de navegador comum (Accept,
Accept-Language, Accept-Encoding, Sec-Fetch-*, etc.) é suficiente para
passar — sem proxy, sem bypass, sem IP residencial. Ver HEADERS abaixo.

INDEPENDÊNCIA DA FONTE (importante):
A Farside também publica sua própria linha-resumo "Total" (acumulado
por ETF, todo o período). Esse número é útil como conferência, mas o
produto NUNCA usa esse valor para exibir nada — os totais mostrados no
site são sempre RECALCULADOS a partir de assets/data/etf-flows-daily.json
(o histórico bruto que este script guarda dia a dia). Se a Farside
parar de publicar essa linha, mudar o formato dela, ou até sair do ar
depois de uma coleta bem-sucedida, o produto continua funcionando
normalmente com os dados já salvos localmente — só o dado do dia atual
deixa de ser atualizado, nada quebra silenciosamente e nada trava por
causa de uma linha auxiliar da fonte.

Por isso: encontrar a linha "Total" da Farside NUNCA é motivo para
falhar a coleta (ver extract() — a ausência dela gera só um aviso). O
que é obrigatório é conseguir ler as linhas de data — isso sim é a
informação primária do produto.

FORMATO DOS ARQUIVOS:
- etf-flows-daily.json: array append-only, 1 objeto por data já
  publicada pela Farside — é a ÚNICA fonte de verdade do produto, tudo
  mais é derivado dela.
  [{"date": "2026-07-21", "flows": {"IBIT": 163.9, ..., "TOTAL": 203.2}}]
- etf-flows-summary.json: snapshot (sobrescrito a cada execução, não é
  histórico).
  {"totals": {"IBIT": 60770.0, ..., "TOTAL": 51838.0},   // RECALCULADO
                                                          // a partir do daily,
                                                          // nunca copiado da Farside
   "farside_totals": {"IBIT": 60770.0, ...},              // linha "Total" da
                                                          // própria Farside, só
                                                          // para conferência —
                                                          // pode faltar sem
                                                          // quebrar a coleta
   "tickers": ["IBIT", "FBTC", ...],
   "last_date": "2026-07-21", "collected_at": "2026-...Z"}

JANELA DE REPROCESSAMENTO (REPROCESS_DAYS, hoje 7 dias):
A Farside publica a linha de um dia bem antes de ela estar completa
(no começo só com "-" em quase todo ETF) e vai preenchendo os valores
reais ao longo do dia seguinte. Por isso este script NÃO trata mais o
histórico inteiro como imutável: as últimas REPROCESS_DAYS datas
retornadas pela Farside são sempre comparadas com o que já está salvo e
SOBRESCRITAS se algum valor mudou — é assim que uma linha capturada
incompleta se autocorrige nas execuções seguintes, sem precisar de
nenhuma ação manual. Datas mais antigas que a janela nunca são tocadas
(histórico assentado continua imutável). Ver README, seção ETF Flows,
para a decisão completa por trás disso.

FAIL-SAFE (FAILSAFE_MAX_OVERWRITTEN_DATES_PCT / _VALUES_PCT): como este
script commita sozinho, sem revisão humana, reprocessar() distingue
PREENCHIMENTO (None -> valor, sempre normal) de SOBRESCRITA (valor real
-> outro valor real, ou -> None de novo — o padrão de um bug estrutural
de parsing). Se a fração de datas ou de valores sobrescritos passar do
limite, main() aborta ANTES de qualquer save_json() — nada é escrito
nem commitado, e o job falha visivelmente na aba Actions. Ver README,
seção ETF Flows, para o raciocínio completo.

Este script roda 2x/dia no GitHub Actions, com o MESMO comportamento
nas duas execuções (só o horário do cron muda):
- .github/workflows/update-etf-flows.yml (produção, 11:00 Brasília) —
  alimenta o site.
- .github/workflows/verify-etf-flows.yml (conferência, 18:00 Brasília)
  — mesma chamada, mais a flag --audit-log (ver parse_args()), que
  grava 1 linha de auditoria por execução em scripts/research/
  independente de ter havido mudança ou não. Nunca roda no navegador
  do visitante.

Ver também scripts/etf_flows_research.py — instrumento SEPARADO e
TEMPORÁRIO (não decide nada aqui, só observa) que reaproveita
fetch_html()/extract() deste arquivo para descobrir estatisticamente o
horário em que a Farside costuma terminar de publicar um dia.
"""
import argparse
import gzip
import html.parser
import json
import os
import re
import sys
import urllib.request
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "data")
DAILY_PATH = os.path.join(DATA_DIR, "etf-flows-daily.json")
SUMMARY_PATH = os.path.join(DATA_DIR, "etf-flows-summary.json")
URL = "https://farside.co.uk/bitcoin-etf-flow-all-data/"

# Quantos dos dias mais recentes (segundo a própria Farside, não do
# calendário) são sempre comparados de novo e sobrescritos se mudarem.
# Único lugar do pipeline que essa janela é definida — se um dia
# decidirmos que o certo é 14 ou 30, muda só este número.
REPROCESS_DAYS = 7

# FAIL-SAFE: distingue PREENCHIMENTO (None -> valor — o que o
# reprocessamento existe pra fazer, pode ser numeroso e legítimo, ex.:
# recuperar um atraso de vários dias de uma vez) de SOBRESCRITA (um
# valor que já era real virando outro valor real, ou virando None de
# novo — raro em operação normal, é o padrão esperado de um bug
# estrutural de parsing corrompendo a coleta em massa). Só sobrescritas
# contam pro fail-safe; preenchimento nunca dispara isso, não importa o
# volume. Ver reprocessar() e a checagem em main().
#
# Os dois limites abaixo são PROPORCIONAIS ao tamanho da janela (não
# números fixos), pra continuarem corretos se REPROCESS_DAYS mudar.
# Valores iniciais propositalmente conservadores (bem acima do único
# caso real já observado: 1 data, 1 valor — ver README, seção ETF
# Flows) — recalibrar depois de algumas semanas de dado real em
# scripts/research/etf-flows-verify-log.jsonl, não são números
# definitivos.
FAILSAFE_MAX_OVERWRITTEN_DATES_PCT = 0.5   # fração das datas da janela com >=1 sobrescrita
FAILSAFE_MAX_OVERWRITTEN_VALUES_PCT = 0.25  # fração do total de valores possíveis na janela

# Confirmado via diagnóstico real (ver commits de teste): headers
# mínimos levam a 403 da Cloudflare; este conjunto, equivalente ao que
# um navegador comum manda, passa sem nenhum truque.
HEADERS = {
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
    req = urllib.request.Request(URL, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=30) as resp:
        raw = resp.read()
        encoding = (resp.headers.get("Content-Encoding") or "").lower()
    if encoding == "gzip":
        raw = gzip.decompress(raw)
    return raw.decode("utf-8", errors="replace")


def extract(html_text):
    """Retorna (tickers, daily_rows, farside_totals) a partir do HTML bruto.
    daily_rows: lista de {"date": ..., "flows": {ticker: valor_ou_None}} —
    esta é a informação PRIMÁRIA e obrigatória (ver main(), que recalcula
    os totais exibidos a partir dela, nunca a partir de farside_totals).
    farside_totals: {ticker: valor_acumulado} — linha-resumo "Total" que a
    própria Farside publica. É só um valor de CONFERÊNCIA: se não for
    encontrada, retorna {} e a coleta continua normalmente (ver main()).
    """
    parser = _TableParser()
    parser.feed(html_text)

    # ESTRUTURA REAL OBSERVADA (confirmada via diagnóstico contra a página
    # ao vivo, não presumida): o rótulo "Total" mora na linha ACIMA da
    # linha de tickers (provavelmente rowspan na tabela original), e a
    # linha de tickers termina com uma célula vazia, não com "Total".
    # Por isso identificamos a linha de cabeçalho pela quantidade de
    # tickers que ela contém — não pela posição de nenhuma célula
    # específica, o que também sobrevive à Farside adicionar/remover
    # ETFs (já vimos MSBT entrar no meio do ano).
    header_row = None
    header_idx = None
    best_count = 0
    for idx, row in enumerate(parser.rows):
        candidatos = [c.strip() for c in row if re.fullmatch(r"[A-Z]{2,6}", c.strip())]
        if len(candidatos) > best_count:
            best_count = len(candidatos)
            header_row = row
            header_idx = idx

    if header_row is None or best_count < 8:
        raise RuntimeError(
            "Não encontrei uma linha com pelo menos 8 tickers de ETF no HTML "
            f"(melhor candidata teve {best_count}). Total de linhas de tabela "
            f"encontradas: {len(parser.rows)}. A Farside provavelmente mudou "
            "o layout da página — inspecionar o HTML bruto manualmente antes "
            "de ajustar este parser."
        )

    tickers = [c.strip() for c in header_row if re.fullmatch(r"[A-Z]{2,6}", c.strip())]

    daily_rows = []
    farside_totals = {}
    for row in parser.rows[header_idx + 1:]:
        if not row:
            continue
        label = row[0].strip()
        if label.lower() in SUMMARY_LABELS:
            if label.lower() == "total" and not farside_totals:
                values = row[1:]
                for i, ticker in enumerate(tickers):
                    if i < len(values):
                        farside_totals[ticker] = _parse_value(values[i])
                if len(values) > len(tickers):
                    farside_totals["TOTAL"] = _parse_value(values[len(tickers)])
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
    # NUNCA falhar por falta da linha "Total" da Farside — ela é só
    # conferência (ver docstring do módulo). Se sumir, a coleta das
    # linhas de data (a informação primária) segue normalmente.
    if not farside_totals:
        print("[aviso] Linha-resumo 'Total' da Farside não encontrada nesta "
              "coleta — sem impacto no produto, os totais exibidos são "
              "recalculados a partir do histórico salvo, não desta linha.")

    return tickers, daily_rows, farside_totals


def load_daily():
    try:
        with open(DAILY_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return []


def save_json(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, separators=(",", ":"))


def append_jsonl(path, obj):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "a", encoding="utf-8") as f:
        f.write(json.dumps(obj, separators=(",", ":")) + "\n")


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--audit-log",
        default=None,
        help=(
            "Caminho para anexar 1 linha JSONL com estatísticas desta "
            "execução (dias comparados, datas alteradas, ETFs alterados, "
            "se haveria commit de dado público). Só o workflow de "
            "conferência (18:00 Brasília) passa essa flag — a produção "
            "(11:00) roda sem ela."
        ),
    )
    return parser.parse_args()


# Reprocessa as REPROCESS_DAYS datas mais recentes que a Farside está
# publicando agora: se o valor salvo diverge do que acabou de ser
# baixado, sobrescreve (é assim que uma linha capturada incompleta se
# autocorrige sozinha nas execuções seguintes). Datas fora dessa janela
# nunca são tocadas.
#
# Toda diferença é classificada em uma das duas categorias (ver
# FAILSAFE_* acima para o porquê dessa distinção):
# - preenchimento: valor salvo era None, o novo não é — sempre normal.
# - sobrescrita: valor salvo já era real (não-None) e o novo é
#   diferente (inclusive se o novo for None) — o sinal que alimenta o
#   fail-safe em main().
#
# Retorna um dict de estatísticas (não uma tupla) pra facilitar adicionar
# campos novos no futuro sem quebrar quem já chama esta função.
def reprocessar(daily, new_rows):
    existing_by_date = {row["date"]: row for row in daily}
    new_rows_sorted = sorted(new_rows, key=lambda row: row["date"])
    reproc_dates = {row["date"] for row in new_rows_sorted[-REPROCESS_DAYS:]}

    added = 0
    changed_dates = 0
    fills = 0
    overwrites = 0
    overwritten_dates = 0
    for row in new_rows_sorted:
        date = row["date"]
        if date not in existing_by_date:
            daily.append(row)
            existing_by_date[date] = row
            added += 1
            continue
        if date not in reproc_dates:
            continue  # histórico fora da janela: nunca reescrito
        old_flows = existing_by_date[date]["flows"]
        new_flows = row["flows"]
        if old_flows == new_flows:
            continue

        date_has_overwrite = False
        for t in new_flows:
            old_v, new_v = old_flows.get(t), new_flows.get(t)
            if old_v == new_v:
                continue
            if old_v is None:
                fills += 1
            else:
                overwrites += 1
                date_has_overwrite = True

        existing_by_date[date]["flows"] = new_flows
        changed_dates += 1
        if date_has_overwrite:
            overwritten_dates += 1

    daily.sort(key=lambda row: row["date"])
    return {
        "added": added,
        "changed_dates": changed_dates,
        "etfs_changed": fills + overwrites,
        "fills": fills,
        "overwrites": overwrites,
        "overwritten_dates": overwritten_dates,
        "window_dates": len(reproc_dates),
    }


def main():
    args = parse_args()

    try:
        html_text = fetch_html()
    except Exception as e:
        print(f"[FALHA] Não consegui buscar {URL}: {e}")
        sys.exit(1)

    try:
        tickers, new_rows, farside_totals = extract(html_text)
    except Exception as e:
        # Em caso de falha de parsing, imprime uma amostra do HTML bruto
        # no log do Actions — é o diagnóstico real, não uma suposição.
        print(f"[FALHA] Erro ao interpretar a tabela da Farside: {e}")
        print("----- amostra do HTML recebido (primeiros 2000 caracteres) -----")
        print(html_text[:2000])
        sys.exit(1)

    daily = load_daily()
    stats = reprocessar(daily, new_rows)

    # FAIL-SAFE — checado ANTES de qualquer save_json(): se a fração de
    # datas/valores SOBRESCRITOS (não preenchidos, ver reprocessar())
    # passar do limite, tratamos como possível bug estrutural de parsing
    # e abortamos sem escrever nem commitar nada. Ver FAILSAFE_* acima.
    window_dates = stats["window_dates"]
    total_possible_values = window_dates * (len(tickers) + 1)  # +1 = chave "TOTAL"
    overwritten_dates_pct = (stats["overwritten_dates"] / window_dates) if window_dates else 0.0
    overwritten_values_pct = (stats["overwrites"] / total_possible_values) if total_possible_values else 0.0

    if (
        overwritten_dates_pct > FAILSAFE_MAX_OVERWRITTEN_DATES_PCT
        or overwritten_values_pct > FAILSAFE_MAX_OVERWRITTEN_VALUES_PCT
    ):
        print("[FALHA] Possível mudança estrutural detectada na Farside.")
        print(
            f"  - {stats['overwritten_dates']}/{window_dates} datas reprocessadas "
            f"tiveram sobrescrita de valor real "
            f"({overwritten_dates_pct:.0%}, limite {FAILSAFE_MAX_OVERWRITTEN_DATES_PCT:.0%})"
        )
        print(
            f"  - {stats['overwrites']}/{total_possible_values} valores possíveis "
            f"da janela foram sobrescritos "
            f"({overwritten_values_pct:.0%}, limite {FAILSAFE_MAX_OVERWRITTEN_VALUES_PCT:.0%})"
        )
        print("Commit automático cancelado. Necessária revisão manual.")
        if args.audit_log:
            now_utc = datetime.now(timezone.utc)
            append_jsonl(args.audit_log, {
                "run_at_utc": now_utc.isoformat(),
                "run_at_brt": now_utc.astimezone(ZoneInfo("America/Sao_Paulo")).isoformat(),
                "days_compared": REPROCESS_DAYS,
                "dates_changed": stats["changed_dates"],
                "etfs_changed": stats["etfs_changed"],
                "commit_made": False,
                "aborted": True,
            })
        sys.exit(2)

    save_json(DAILY_PATH, daily)

    # Totais exibidos no produto = SEMPRE recalculados a partir do
    # histórico que acabamos de salvar (daily), nunca copiados da
    # Farside — é isso que garante que o site continua funcionando
    # normalmente mesmo que a Farside saia do ar ou mude de formato
    # amanhã. Dia sem dado (None) é ignorado na soma, não vira 0.
    computed_totals = {}
    for ticker in tickers + ["TOTAL"]:
        soma = None
        for row in daily:
            v = row["flows"].get(ticker)
            if v is None:
                continue
            soma = (soma or 0) + v
        computed_totals[ticker] = soma

    # farside_totals é só conferência: se divergir de forma relevante do
    # que recalculamos a partir do próprio histórico salvo, avisa (não
    # falha) — normalmente indica um dia faltando ou um bug de parsing.
    if farside_totals:
        for ticker, farside_val in farside_totals.items():
            nosso_val = computed_totals.get(ticker)
            if nosso_val is None or farside_val is None:
                continue
            if abs(nosso_val - farside_val) > max(1.0, abs(farside_val) * 0.01):
                print(f"[aviso] Total recalculado de {ticker} ({nosso_val}) diverge "
                      f"do total publicado pela Farside ({farside_val}) além da "
                      "tolerância — conferir se falta algum dia no histórico salvo.")

    summary = {
        "tickers": tickers,
        "totals": computed_totals,
        "farside_totals": farside_totals,
        "last_date": daily[-1]["date"] if daily else None,
        "collected_at": datetime.now(timezone.utc).isoformat(),
    }
    save_json(SUMMARY_PATH, summary)

    print(
        f"OK: {stats['added']} dia(s) novo(s), {stats['changed_dates']} dia(s) "
        f"reprocessado(s) ({stats['fills']} preenchimento(s), {stats['overwrites']} "
        f"sobrescrita(s)) dentro da janela de {REPROCESS_DAYS} dias. "
        f"Último dia: {summary['last_date']}. Tickers: {', '.join(tickers)}."
    )

    if args.audit_log:
        now_utc = datetime.now(timezone.utc)
        now_brt = now_utc.astimezone(ZoneInfo("America/Sao_Paulo"))
        append_jsonl(args.audit_log, {
            "run_at_utc": now_utc.isoformat(),
            "run_at_brt": now_brt.isoformat(),
            "days_compared": REPROCESS_DAYS,
            "dates_changed": stats["changed_dates"],
            "etfs_changed": stats["etfs_changed"],
            "commit_made": bool(stats["added"] or stats["changed_dates"]),
            "aborted": False,
        })


if __name__ == "__main__":
    main()
