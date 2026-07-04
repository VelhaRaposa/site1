#!/usr/bin/env python3
"""
update_btc_history.py
======================
Atualiza assets/data/btc-history.json com os dias que ainda faltam,
desde a última data presente no arquivo até hoje.

Este script NÃO roda no navegador do visitante do site — ele roda
apenas aqui, no GitHub Actions (veja .github/workflows/update-btc-history.yml),
uma vez por semana. A calculadora do site continua 100% local e sem
nenhuma chamada de rede.

Fonte usada para os dias novos: API pública da CoinGecko, já com
preço direto em reais (BRL). Se você tiver uma chave gratuita da
CoinGecko, o script a usa automaticamente via variável de ambiente
COINGECKO_API_KEY (configurada como "Secret" no GitHub, nunca fica
exposta no site).

Uso manual (opcional, no seu computador):
    python3 scripts/update_btc_history.py
"""

import json
import os
import sys
import urllib.request
from datetime import datetime, timedelta, timezone

DATA_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "..", "assets", "data", "btc-history.json"
)


def load_data():
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def save_data(data):
    with open(DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, separators=(",", ":"))


def fetch_range(from_ts, to_ts, api_key):
    url = (
        "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart/range"
        f"?vs_currency=brl&from={from_ts}&to={to_ts}"
    )
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    if api_key:
        req.add_header("x-cg-demo-api-key", api_key)
    with urllib.request.urlopen(req, timeout=30) as resp:
        payload = json.loads(resp.read().decode("utf-8"))
    return payload.get("prices", [])


def main():
    try:
        data = load_data()
    except FileNotFoundError:
        print(f"Arquivo não encontrado em {DATA_PATH}. Nada a fazer.")
        sys.exit(1)

    if not data:
        print("btc-history.json está vazio, abortando.")
        sys.exit(1)

    last_date_str = data[-1]["date"]
    last_dt = datetime.strptime(last_date_str, "%Y-%m-%d").date()
    today = datetime.now(timezone.utc).date()

    if last_dt >= today - timedelta(days=1):
        print(f"Já está atualizado (última data: {last_date_str}).")
        return

    from_dt = last_dt + timedelta(days=1)
    from_ts = int(datetime.combine(from_dt, datetime.min.time(), tzinfo=timezone.utc).timestamp())
    to_ts = int(datetime.combine(today, datetime.min.time(), tzinfo=timezone.utc).timestamp())

    api_key = os.environ.get("COINGECKO_API_KEY", "").strip()

    try:
        prices = fetch_range(from_ts, to_ts, api_key)
    except Exception as e:
        print(f"Falha ao buscar dados novos: {e}")
        sys.exit(1)

    if not prices:
        print("Nenhum dado novo retornado pela API.")
        return

    # agrupa por dia (a API retorna vários pontos por dia às vezes),
    # ficando com o último preço de cada dia
    daily = {}
    for ts_ms, price in prices:
        d = datetime.fromtimestamp(ts_ms / 1000, tz=timezone.utc).strftime("%Y-%m-%d")
        daily[d] = price

    existing_dates = {row["date"] for row in data}
    today_str = today.strftime("%Y-%m-%d")
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
