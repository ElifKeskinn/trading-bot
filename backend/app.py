from flask import Flask, request, jsonify
from flask_cors import CORS
from trading_bot import (
    get_binance_client,
    get_historical_data,
    compute_indicators,
    generate_signals,
    backtest_strategy,
    plot_signals,
    display_trades,
    plot_profit_comparison
)
from datetime import datetime, timedelta
import threading
import os
import json
import logging

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}}) 

# Loglama ayarlarını yapın
logging.basicConfig(level=logging.DEBUG)

# Global değişkenler
bot_running = False
bot_thread = None
stored_trades = {}
stored_profits = []

def run_trading_bot(symbol, historical_days, timeframes, initial_capital):
    global stored_trades, stored_profits, bot_running
    try:
        app.logger.info(f"Starting trading bot for symbol: {symbol}")
        client = get_binance_client(testnet=True)
        now = datetime.utcnow()
        past = now - timedelta(days=historical_days)
        past_str = past.strftime("%Y-%m-%d %H:%M:%S")

        data = {}
        trades_all = {}
        profits = []

        for timeframe in timeframes:
            app.logger.info(f"Processing timeframe: {timeframe}")
            df = get_historical_data(client, symbol, timeframe, past_str)
            df = compute_indicators(df, timeframe)
            df = generate_signals(df, timeframe)
            trades, profit = backtest_strategy(df, initial_capital=initial_capital)
            data[timeframe] = df.to_dict()  # DataFrame'i sözlüğe dönüştürün
            trades_all[timeframe] = trades
            profits.append(profit)

        # Sonuçları global değişkenlere kaydedin
        stored_trades = trades_all
        stored_profits = profits

        # JSON dosyasına kaydetmek isterseniz:
        results = {
            "data": data,
            "trades": trades_all,
            "profits": profits
        }

        with open('backend/trading_results.json', 'w') as f:
            json.dump(results, f, default=str)

        app.logger.info("Backtesting completed.")
        app.logger.info(f"Total Profit/Loss: {sum(profits):.2f} USDT")
    except Exception as e:
        app.logger.error(f"Error in run_trading_bot: {str(e)}")
    finally:
        bot_running = False

@app.route('/', methods=['GET'])
def home():
    return "Flask Backend is running."

@app.route('/api/start_bot', methods=['POST'])
def start_bot():
    global bot_running, bot_thread
    if bot_running:
        app.logger.warning("Attempted to start bot, but it is already running.")
        return jsonify({"message": "Bot is already running."}), 400
    
    try:
        data = request.json
        symbol = data.get('symbol', 'ETHUSDT')
        historical_days = data.get('historical_days', 60)
        timeframes = data.get('timeframes', ['5m', '1h'])
        initial_capital = data.get('initial_capital', 10000)

        app.logger.info(f"Starting bot with symbol: {symbol}, historical_days: {historical_days}, timeframes: {timeframes}, initial_capital: {initial_capital}")

        bot_thread = threading.Thread(target=run_trading_bot, args=(symbol, historical_days, timeframes, initial_capital))
        bot_thread.start()
        bot_running = True

        return jsonify({"message": "Bot started successfully."}), 200
    except Exception as e:
        app.logger.error(f"Error starting bot: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/stop_bot', methods=['POST'])
def stop_bot():
    global bot_running, bot_thread
    if not bot_running:
        app.logger.warning("Attempted to stop bot, but it is not running.")
        return jsonify({"message": "Bot is not running."}), 400
    
    try:
        # Botu durdurmak için gerekli mantığı ekleyin
        # Bu örnekte sadece bot_running bayrağını False yapıyoruz
        bot_running = False
        if bot_thread:
            bot_thread.join(timeout=1)
            app.logger.info("Bot stopped successfully.")
        return jsonify({"message": "Bot stopped successfully."}), 200
    except Exception as e:
        app.logger.error(f"Error stopping bot: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/backtest', methods=['POST'])
def backtest():
    try:
        data = request.json
        symbol = data.get('symbol', 'ETHUSDT')
        historical_days = data.get('historical_days', 60)
        timeframes = data.get('timeframes', ['5m', '1h'])
        initial_capital = data.get('initial_capital', 10000)

        app.logger.info(f"Running backtest with symbol: {symbol}, historical_days: {historical_days}, timeframes: {timeframes}, initial_capital: {initial_capital}")

        client = get_binance_client(testnet=True)

        now = datetime.utcnow()
        past = now - timedelta(days=historical_days)
        past_str = past.strftime("%Y-%m-%d %H:%M:%S")

        results = {}
        for timeframe in timeframes:
            app.logger.info(f"Processing timeframe: {timeframe}")
            df = get_historical_data(client, symbol, timeframe, past_str)
            df = compute_indicators(df, timeframe)
            df = generate_signals(df, timeframe)
            trades, profit = backtest_strategy(df, initial_capital=initial_capital)
            results[timeframe] = {
                "trades": trades,
                "profit": profit
            }

        return jsonify(results), 200
    except Exception as e:
        app.logger.error(f"Backtest error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/get_trades', methods=['GET'])
def get_trades():
    """
    Retrieve stored trades.
    """
    try:
        return jsonify({"trades": stored_trades}), 200
    except Exception as e:
        app.logger.error(f"Error retrieving trades: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/get_profit', methods=['GET'])
def get_profit():
    """
    Retrieve stored profit data.
    """
    try:
        return jsonify({"profits": stored_profits}), 200
    except Exception as e:
        app.logger.error(f"Error retrieving profit data: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/bot_status', methods=['GET'])
def bot_status_route():
    """
    Retrieve bot status.
    """
    try:
        return jsonify({"bot_running": bot_running}), 200
    except Exception as e:
        app.logger.error(f"Error retrieving bot status: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
