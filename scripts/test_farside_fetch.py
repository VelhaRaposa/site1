#!/usr/bin/env python3
"""
test_farside_fetch.py — TEMPORÁRIO, só para diagnóstico.
==========================================================
Não salva nada, não commita nada. Só faz o GET da Farside a partir do
runner do GitHub Actions e roda o parser real (extract(), de
update_etf_flows.py) contra a resposta, imprimindo tudo no log.

Este arquivo e o workflow .github/workflows/test-farside-fetch.yml
devem ser removidos assim que o teste responder a pergunta "a Farside
responde normalmente a partir do GitHub Actions?".
"""
import sys
import urllib.request

sys.path.insert(0, __file__.rsplit("/", 1)[0])
from update_etf_flows import extract, URL

print(f"1) GET {URL}")
try:
    req = urllib.request.Request(URL, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        status = resp.status
        final_url = resp.geturl()
        html_text = resp.read().decode("utf-8", errors="replace")
except Exception as e:
    print(f"[FALHA NO GET] {type(e).__name__}: {e}")
    sys.exit(1)

print(f"2) Status HTTP: {status}")
print(f"3) URL final (após redirecionamentos, se houver): {final_url}")
print(f"   Tamanho da resposta: {len(html_text)} caracteres")
print("4) Amostra do HTML retornado (primeiros 3000 caracteres):")
print("-" * 70)
print(html_text[:3000])
print("-" * 70)

print("5) Rodando o parser real (extract()) contra o HTML recebido...")
try:
    tickers, daily_rows, totals = extract(html_text)
except Exception as e:
    print(f"[FALHA NO PARSER] {type(e).__name__}: {e}")
    sys.exit(1)

print(f"6) Tickers encontrados ({len(tickers)}): {tickers}")
print(f"   Linhas de data encontradas: {len(daily_rows)}")
if daily_rows:
    print(f"   Primeira data: {daily_rows[0]['date']}  |  Última data: {daily_rows[-1]['date']}")

print("7) Valores da última linha de data disponível:")
if daily_rows:
    ultima = daily_rows[-1]
    for t in ("IBIT", "FBTC", "ARKB"):
        print(f"   {t}: {ultima['flows'].get(t)}")
    print(f"   TOTAL (do dia): {ultima['flows'].get('TOTAL')}")

print("   Totais acumulados (linha-resumo 'Total' da própria Farside):")
for t in ("IBIT", "FBTC", "ARKB"):
    print(f"   {t}: {totals.get(t)}")
print(f"   TOTAL (geral): {totals.get('TOTAL')}")

print("\nOK: coleta e parsing concluídos sem exceção.")
