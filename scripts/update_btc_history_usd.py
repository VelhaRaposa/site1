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

Duas fontes, dois papéis (testado e confirmado neste projeto):

- BOOTSTRAP (só quando o arquivo ainda não existe): blockchain.info
  Charts API (`charts/market-price`), sem chave, com histórico desde os
  primórdios do Bitcoin. A CoinGecko foi tentada primeiro para isso, mas
  seu endpoint de histórico profundo (>365 dias) responde 401 mesmo com
  uma API key gratuita (Demo) — esse acesso é restrito a planos pagos.
- INCREMENTAL (dias novos, toda semana): CoinGecko (vs_currency=usd),
  mesmo mecanismo já validado pelo update_btc_history.py em BRL — janelas
  pequenas (poucos dias) continuam funcionando sem chave.

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


def fetch_bootstrap_blockchain_info():
    """Busca o histórico completo (desde os primórdios do Bitcoin) na API
    pública da blockchain.info — sem chave. sampled=false pede resolução
    diária completa, em vez da versão reduzida usada para desenhar
    gráficos no site deles."""
    url = "https://api.blockchain.info/charts/market-price?timespan=all&format=json&sampled=false"
    req = urllib.request.Request(url, headers={
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; caiogare-site-databot/1.0)",
    })
    with urllib.request.urlopen(req, timeout=60) as resp:
        payload = json.loads(resp.read().decode("utf-8"))
    values = payload.get("values") or []
    daily = {}
    for point in values:
        d = datetime.fromtimestamp(point["x"], tz=timezone.utc).strftime("%Y-%m-%d")
        daily[d] = point["y"]
    return daily


def fetch_range_coingecko(from_ts, to_ts, api_key):
    url = (
        "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart/range"
        f"?vs_currency=usd&from={from_ts}&to={to_ts}"
    )
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    if api_key:
        req.add_header("x-cg-demo-api-key", api_key)
    with urllib.request.urlopen(req, timeout=60) as resp:
        payload = json.loads(resp.read().decode("utf-8"))
    prices = payload.get("prices", [])
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
        print(f"{DATA_PATH} não existe ainda — buscando histórico completo na blockchain.info (bootstrap único).")
        try:
            daily = fetch_bootstrap_blockchain_info()
        except Exception as e:
            print(f"Falha no bootstrap via blockchain.info: {e}")
            sys.exit(1)
        # descarta qualquer ponto anterior ao início do histórico em BRL,
        # para os dois arquivos cobrirem exatamente o mesmo período
        daily = {d: p for d, p in daily.items() if d >= BOOTSTRAP_START_DATE}
        existing_dates = set()
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
            daily = fetch_range_coingecko(from_ts, to_ts, api_key)
        except Exception as e:
            print(f"Falha ao buscar dados novos: {e}")
            sys.exit(1)
        existing_dates = {row["date"] for row in data}

    if not daily:
        print("Nenhum dado novo retornado pela API.")
        return

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
