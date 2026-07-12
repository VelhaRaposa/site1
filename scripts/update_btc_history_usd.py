#!/usr/bin/env python3
"""
update_btc_history_usd.py
==========================
Mantém assets/data/btc-history-usd.json atualizado, em dólar (USD).

Existe como um arquivo separado de update_btc_history.py (que é em reais,
BRL) porque comparar ciclos históricos do Bitcoin exige a série nativa em
USD — converter BRL por uma taxa de câmbio embutiria a volatilidade do
real (e faltam dados de câmbio para 2010-2014) na análise de um ativo
que não é brasileiro.

Este script NÃO roda no navegador do visitante do site — ele roda
apenas aqui, no GitHub Actions (veja .github/workflows/update-btc-history.yml),
uma vez por semana, junto com a atualização em BRL.

Se o arquivo ainda não existir, faz uma busca única (bootstrap) desde
2010-07-18 (mesma data de início do histórico em BRL) até hoje. Se já
existir, busca só os dias que faltam desde a última data presente.

Fonte: API pública da CoinGecko (vs_currency=usd). Mesma chave opcional
COINGECKO_API_KEY do script em BRL.

Uso manual (opcional, no seu computador):
    python3 scripts/update_btc_history_usd.py
"""

import json
import os
import sys
import urllib.request
from datetime import datetime, timedelta, timezone

DATA_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "..", "assets", "data", "btc-history-usd.json"
)

BOOTSTRAP_START_DATE = "2010-07-18"  # mesma data de início do btc-history.json (BRL)


def load_data():
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def save_data(data):
    with open(DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, separators=(",", ":"))


def fetch_range(from_ts, to_ts, api_key):
    url = (
        "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart/range"
        f"?vs_currency=usd&from={from_ts}&to={to_ts}"
    )
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    if api_key:
        req.add_header("x-cg-demo-api-key", api_key)
    with urllib.request.urlopen(req, timeout=60) as resp:
        payload = json.loads(resp.read().decode("utf-8"))
    return payload.get("prices", [])


def to_daily(prices):
    """Agrupa por dia (a API retorna vários pontos por dia às vezes),
    ficando com o último preço de cada dia."""
    daily = {}
    for ts_ms, price in prices:
        d = datetime.fromtimestamp(ts_ms / 1000, tz=timezone.utc).strftime("%Y-%m-%d")
        daily[d] = price
    return daily


def main():
    api_key = os.environ.get("COINGECKO_API_KEY", "").strip()
    today = datetime.now(timezone.utc).date()
    today_str = today.strftime("%Y-%m-%d")

    try:
        data = load_data()
        bootstrap = False
    except FileNotFoundError:
        data = []
        bootstrap = True

    if bootstrap:
        from_dt = datetime.strptime(BOOTSTRAP_START_DATE, "%Y-%m-%d").date()
        print(f"{DATA_PATH} não existe ainda — buscando histórico completo desde {BOOTSTRAP_START_DATE}.")
    else:
        if not data:
            print("btc-history-usd.json está vazio, abortando.")
            sys.exit(1)
        last_date_str = data[-1]["date"]
        last_dt = datetime.strptime(last_date_str, "%Y-%m-%d").date()
        if last_dt >= today - timedelta(days=1):
            print(f"Já está atualizado (última data: {last_date_str}).")
            return
        from_dt = last_dt + timedelta(days=1)

    from_ts = int(datetime.combine(from_dt, datetime.min.time(), tzinfo=timezone.utc).timestamp())
    to_ts = int(datetime.combine(today, datetime.min.time(), tzinfo=timezone.utc).timestamp())

    try:
        prices = fetch_range(from_ts, to_ts, api_key)
    except Exception as e:
        print(f"Falha ao buscar dados novos: {e}")
        sys.exit(1)

    if not prices:
        print("Nenhum dado novo retornado pela API.")
        return

    daily = to_daily(prices)
    existing_dates = {row["date"] for row in data}
    added = 0

    for d in sorted(daily.keys()):
        if d in existing_dates or d >= today_str:
            continue  # não inclui o dia de hoje (ainda incompleto) nem duplicatas
        data.append({"date": d, "price": round(daily[d], 2)})
        added += 1

    if added == 0:
        print("Nenhum dia novo para adicionar (dados já cobertos ou só faltava hoje).")
        return

    data.sort(key=lambda row: row["date"])
    save_data(data)
    print(f"OK: adicionados {added} dia(s). Novo intervalo final: {data[-1]['date']}")


if __name__ == "__main__":
    main()
