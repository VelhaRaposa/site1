#!/usr/bin/env python3
"""
test_farside_fetch.py — TEMPORÁRIO, só para diagnóstico.
==========================================================
Etapa 4 (validação final): busca a página real
(farside.co.uk/bitcoin-etf-flow-all-data/, já confirmada como fonte
mais simples e completa) e roda o extract() de produção (já corrigido
contra a estrutura real) — imprime Total Geral, IBIT, FBTC, ARKB e
GBTC para comparação direta com o que está visível na Farside.

Não salva nada, não commita nada. Este arquivo e o workflow
.github/workflows/test-farside-fetch.yml são temporários — remover
assim que esta validação for aprovada.
"""
import sys

sys.path.insert(0, __file__.rsplit("/", 1)[0])
from update_etf_flows import URL, fetch_html, extract


def main():
    print(f"GET {URL}")
    try:
        html_text = fetch_html()
    except Exception as e:
        print(f"[FALHA NO GET] {type(e).__name__}: {e}")
        sys.exit(1)

    print(f"Tamanho da página: {len(html_text)} caracteres")

    try:
        tickers, daily_rows, totals = extract(html_text)
    except Exception as e:
        print(f"[FALHA NO PARSER] {type(e).__name__}: {e}")
        sys.exit(1)

    print(f"Tickers: {tickers}")
    print(f"Linhas de data: {len(daily_rows)}  (primeira: {daily_rows[0]['date']}, última: {daily_rows[-1]['date']})")

    print("\n=== COMPARAÇÃO — valores extraídos ===")
    print(f"Total Geral (acumulado, todos os ETFs): {totals.get('TOTAL')}")
    for t in ("IBIT", "FBTC", "ARKB", "GBTC"):
        print(f"Total acumulado {t}: {totals.get(t)}")

    ultimo = daily_rows[-1]
    print(f"\nÚltimo dia disponível: {ultimo['date']}")
    for t in ("IBIT", "FBTC", "ARKB", "GBTC"):
        print(f"  {t}: {ultimo['flows'].get(t)}")
    print(f"  TOTAL (do dia): {ultimo['flows'].get('TOTAL')}")


if __name__ == "__main__":
    main()
