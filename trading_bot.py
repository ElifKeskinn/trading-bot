# trading_bot.py

import pandas as pd
import pandas_ta as ta
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from binance.client import Client
from datetime import datetime, timedelta
from tabulate import tabulate

def get_binance_client(api_key, secret_key, testnet=False):
    """
    Initialize and return the Binance Client.
    
    Parameters:
        api_key (str): Binance API key.
        secret_key (str): Binance Secret key.
        testnet (bool): Whether to use Binance Testnet. Default is False.
    
    Returns:
        Client: Binance Client instance.
    """
    client = Client(api_key=api_key, api_secret=secret_key, tld="com", testnet=testnet)
    return client

def get_historical_data(client, symbol, interval, start_str):
    """
    Fetch historical klines data from Binance and return as a DataFrame.
    
    Parameters:
        client (Client): Binance Client instance.
        symbol (str): Trading pair symbol (e.g., 'ETHUSDT').
        interval (str): Kline interval (e.g., '5m', '1h').
        start_str (str): Start date string (e.g., '2023-01-01 00:00:00').
    
    Returns:
        pd.DataFrame: Historical data.
    """
    bars = client.get_historical_klines(symbol=symbol, interval=interval, start_str=start_str)
    df = pd.DataFrame(bars)
    df["Date"] = pd.to_datetime(df.iloc[:,0], unit="ms")
    df.columns = ["Open Time", "Open", "High", "Low", "Close", "Volume",
                 "Close Time", "Quote Asset Volume", "Number of Trades",
                 "Taker Buy Base Asset Volume", "Taker Buy Quote Asset Volume", "Ignore", "Date"]
    df = df[["Date", "Open", "High", "Low", "Close", "Volume"]].copy()
    df.set_index("Date", inplace=True)
    df = df.apply(pd.to_numeric, errors="coerce")
    return df

def compute_indicators(df, timeframe):
    """
    Compute technical indicators (Bollinger Bands, RSI, MACD) and add them to the DataFrame.
    
    Parameters:
        df (pd.DataFrame): Historical price data.
        timeframe (str): Timeframe of the data ('5m' or '1h').
    
    Returns:
        pd.DataFrame: DataFrame with added indicators.
    """
    # Remove Existing Indicator Columns
    indicator_cols = [
        'BBL_20_2.0', 'BBM_20_2.0', 'BBU_20_2.0', 'BBB_20_2.0', 'BBP_20_2.0',
        'RSI', 'MACD_12_26_9', 'MACDh_12_26_9', 'MACDs_12_26_9'
    ]
    df = df.drop(columns=[col for col in indicator_cols if col in df.columns], errors='ignore')
    
    # Bollinger Bands
    bollinger = ta.bbands(df['Close'], length=20, std=2)
    df = pd.concat([df, bollinger], axis=1)
    
    # RSI
    rsi_length = 14  # Can be adjusted based on timeframe
    df['RSI'] = ta.rsi(df['Close'], length=rsi_length)
    
    # MACD
    macd_params = {'fast': 12, 'slow': 26, 'signal': 9}
    macd = ta.macd(df['Close'], **macd_params)
    df = pd.concat([df, macd], axis=1)
      
    return df

def generate_signals(df, timeframe):
    """
    Generate buy and sell signals based on Bollinger Bands, RSI, and MACD.
    
    Parameters:
        df (pd.DataFrame): DataFrame with technical indicators.
        timeframe (str): Timeframe of the data ('5m' or '1h').
    
    Returns:
        pd.DataFrame: DataFrame with added Buy_Signal and Sell_Signal columns.
    """
    if timeframe == '5m':
        # Stricter conditions for 5-minute timeframe
        rsi_threshold_buy = 50
        rsi_threshold_sell = 50
        bb_proximity = 0.1  # 10% proximity
        macd_condition_buy = True
        macd_condition_sell = True
    elif timeframe == '1h':
        # More flexible conditions for 1-hour timeframe
        rsi_threshold_buy = 55
        rsi_threshold_sell = 45
        bb_proximity = 0.2  # 20% proximity
        macd_condition_buy = False
        macd_condition_sell = False  
    
    # Buy Signal
    if macd_condition_buy:
        buy_signal = (
            (df['Close'] <= df['BBL_20_2.0'] + (df['BBU_20_2.0'] - df['BBL_20_2.0']) * bb_proximity) &
            (df['RSI'] < rsi_threshold_buy) &
            (df['MACD_12_26_9'] > df['MACDs_12_26_9'])
        )
    else:
        buy_signal = (
            (df['Close'] <= df['BBL_20_2.0'] + (df['BBU_20_2.0'] - df['BBL_20_2.0']) * bb_proximity) &
            (df['RSI'] < rsi_threshold_buy)
        )
    
    df['Buy_Signal'] = np.where(buy_signal, 1, 0)
    
    # Sell Signal
    if macd_condition_sell:
        sell_signal = (
            (df['Close'] >= df['BBU_20_2.0'] - (df['BBU_20_2.0'] - df['BBL_20_2.0']) * bb_proximity) &
            (df['RSI'] > rsi_threshold_sell) &
            (df['MACD_12_26_9'] < df['MACDs_12_26_9'])
        )
    else:
        sell_signal = (
            (df['Close'] >= df['BBU_20_2.0'] - (df['BBU_20_2.0'] - df['BBL_20_2.0']) * bb_proximity) &
            (df['RSI'] > rsi_threshold_sell)
        )
    
    df['Sell_Signal'] = np.where(sell_signal, 1, 0)
    
    return df

def backtest_strategy(df, initial_capital=10000, stop_loss_pct=0.02, take_profit_pct=0.04):
    """
    Backtest the trading strategy on historical data.
    
    Parameters:
        df (pd.DataFrame): DataFrame with Buy_Signal and Sell_Signal.
        initial_capital (float): Starting capital in USDT.
        stop_loss_pct (float): Stop-loss percentage.
        take_profit_pct (float): Take-profit percentage.
    
    Returns:
        list: List of trade dictionaries.
        float: Total profit or loss.
    """
    capital = initial_capital
    position = 0  
    buy_price = 0
    trades = []
    
    for index, row in df.iterrows():
        # Buy Signal
        if row['Buy_Signal'] == 1 and position == 0:
            buy_price = row['Close']
            position = 1
            trades.append({'Type': 'Buy', 'Price': buy_price, 'Date': index})
            print(f"Buy at {buy_price} on {index}")
        
        # Sell Signal or Stop-Loss/Take-Profit
        elif position == 1:
            # Take-Profit Check
            if row['Close'] >= buy_price * (1 + take_profit_pct):
                sell_price = row['Close']
                profit = sell_price - buy_price
                capital += profit
                position = 0
                trades.append({'Type': 'Sell', 'Price': sell_price, 'Date': index, 'Profit': profit, 'Reason': 'Take-Profit'})
                print(f"Sell at {sell_price} on {index} | Profit: {profit:.2f} USDT | Reason: Take-Profit")
            # Stop-Loss Check
            elif row['Close'] <= buy_price * (1 - stop_loss_pct):
                sell_price = row['Close']
                profit = sell_price - buy_price
                capital += profit
                position = 0
                trades.append({'Type': 'Sell', 'Price': sell_price, 'Date': index, 'Profit': profit, 'Reason': 'Stop-Loss'})
                print(f"Sell at {sell_price} on {index} | Profit: {profit:.2f} USDT | Reason: Stop-Loss")
            # Sell Signal
            elif row['Sell_Signal'] == 1:
                sell_price = row['Close']
                profit = sell_price - buy_price
                capital += profit
                position = 0
                trades.append({'Type': 'Sell', 'Price': sell_price, 'Date': index, 'Profit': profit, 'Reason': 'Signal'})
                print(f"Sell at {sell_price} on {index} | Profit: {profit:.2f} USDT | Reason: Signal")
    
    # If position still open, sell at last close
    if position == 1:
        sell_price = df.iloc[-1]['Close']
        profit = sell_price - buy_price
        capital += profit
        trades.append({'Type': 'Sell', 'Price': sell_price, 'Date': df.index[-1], 'Profit': profit, 'Reason': 'End'})
        print(f"Sell at {sell_price} on {df.index[-1]} | Profit: {profit:.2f} USDT | Reason: End")
    
    total_profit = capital - initial_capital
    return trades, total_profit

def plot_signals(df, trades, timeframe):
    """
    Plot buy and sell signals along with technical indicators.
    
    Parameters:
        df (pd.DataFrame): DataFrame with price and indicators.
        trades (list): List of trade dictionaries.
        timeframe (str): Timeframe of the data ('5m' or '1h').
    """
    plt.figure(figsize=(14,7))
    
    # Price and Bollinger Bands
    plt.plot(df['Close'], label='Close Price', color='black')
    plt.plot(df['BBU_20_2.0'], label='Upper Bollinger Band', color='blue', linestyle='--')
    plt.plot(df['BBL_20_2.0'], label='Lower Bollinger Band', color='blue', linestyle='--')
       
    # Buy signals
    buys = df[df['Buy_Signal'] == 1]
    plt.scatter(buys.index, buys['Close'], marker='^', color='green', label='Buy Signal', s=100)
    
    # Sell signals
    sells = df[df['Sell_Signal'] == 1]
    plt.scatter(sells.index, sells['Close'], marker='v', color='red', label='Sell Signal', s=100)
    
    # RSI graph
    ax1 = plt.gca()
    ax2 = ax1.twinx()
    ax2.plot(df['RSI'], label='RSI', color='orange', alpha=0.3)
    ax2.axhline(30, color='green', linestyle='--', alpha=0.5)
    ax2.axhline(70, color='red', linestyle='--', alpha=0.5)
    ax2.set_ylabel('RSI')
    
    # MACD graph
    ax3 = ax1.twinx()
    ax3.spines['right'].set_position(('outward', 60))  # Shift MACD axis to the right
    ax3.plot(df['MACD_12_26_9'], label='MACD', color='magenta', alpha=0.3)
    ax3.plot(df['MACDs_12_26_9'], label='Signal Line', color='cyan', alpha=0.3)
    ax3.fill_between(df.index, df['MACDh_12_26_9'], color='grey', alpha=0.1, label='MACD Histogram')
    ax3.set_ylabel('MACD')
    
    plt.title(f'ETHUSDT Buy/Sell Signals and Technical Indicators ({timeframe})')
    plt.xlabel('Date')
    plt.ylabel('Price (USDT)')
    plt.legend(loc='upper left')
    plt.grid()
    plt.show()

def display_trades(trades, timeframe):
    """
    Display trades in a tabular format.
    
    Parameters:
        trades (list): List of trade dictionaries.
        timeframe (str): Timeframe of the data ('5m' or '1h').
    """
    df_trades = pd.DataFrame(trades)
    if 'Profit' not in df_trades.columns:
        df_trades['Profit'] = np.nan
    print(f"\n Transactions in {timeframe} Time Zone::")
    print(tabulate(df_trades, headers='keys', tablefmt='psql', showindex=False))

def plot_profit_comparison(profits, labels=['5m', '1h']):
    """
    Plot a bar chart comparing profits/losses for different timeframes.
    
    Parameters:
        profits (list): List of profit/loss values.
        labels (list): Corresponding labels for each profit/loss value.
    """
    plt.figure(figsize=(8,6))
    bars = plt.bar(labels, profits, color=['green' if p > 0 else 'red' for p in profits])
    plt.title('Strategy Profit/Loss Comparison')
    plt.xlabel('Time Zone')
    plt.ylabel('Profit/Loss (USDT)')
    plt.axhline(0, color='black', linewidth=0.8)
    for bar in bars:
        height = bar.get_height()
        plt.text(bar.get_x() + bar.get_width()/2.0, height, f'{height:.2f}', ha='center', va='bottom')
    plt.show()

def main(api_key, secret_key, symbol="ETHUSDT", historical_days=60, timeframes=['5m', '1h'], initial_capital=10000):
    """
    Main function to run the trading bot.
    
    Parameters:
        api_key (str): Binance API key.
        secret_key (str): Binance Secret key.
        symbol (str): Trading pair symbol.
        historical_days (int): Number of past days to fetch data for.
        timeframes (list): List of timeframes to analyze.
        initial_capital (float): Starting capital in USDT.
    """
    # Set up plotting
    sns.set_style('darkgrid')
    plt.rcParams['figure.figsize'] = (14,7)
    
    # Initialize Binance client
    testnet = False  # Set to True for test data
    client = get_binance_client(api_key, secret_key, testnet)
    
    # Calculate past date
    now = datetime.utcnow()
    past = now - timedelta(days=historical_days)
    past_str = past.strftime("%Y-%m-%d %H:%M:%S")
    
    # Dictionaries to store data for each timeframe
    data = {}
    trades_all = {}
    profits = []
    
    for timeframe in timeframes:
        # Fetch historical data
        df = get_historical_data(client, symbol, timeframe, past_str)
        print(f"\n{timeframe} Data:")
        print(df.head())
        
        # Compute indicators
        df = compute_indicators(df, timeframe)
        print(f"\n{timeframe} Indicators:")
        print(df.tail())
        
        # Generate signals
        df = generate_signals(df, timeframe)
        print(f"\n{timeframe} Signals:")
        print(df[['Buy_Signal', 'Sell_Signal']].tail())
        
        # Count signals
        print("\n=== Signal numbers ===")
        print(f"Number of {timeframe} Buy Signals : {df['Buy_Signal'].sum()}")
        print(f"Number of {timeframe} Sell Signals: {df['Sell_Signal'].sum()}")
        
        # Backtest strategy
        print(f"\n=== {timeframe} Strategy Backtest ===")
        trades, profit = backtest_strategy(df, initial_capital=initial_capital)
        print(f"Total Profit/Loss ({timeframe}): {profit:.2f} USDT")
        
        # Store results
        data[timeframe] = df
        trades_all[timeframe] = trades
        profits.append(profit)
        
        # Plot signals
        print(f"\n=== {timeframe} Signals Graph ===")
        plot_signals(df, trades, timeframe)
        
        # Display trades
        display_trades(trades, timeframe)
    
    # Profit/Loss Comparison
    print("\n=== Profit/Loss Comparison ===")
    for timeframe, profit in zip(timeframes, profits):
        print(f"Total Profit/Loss ({timeframe}): {profit:.2f} USDT")
    
    plot_profit_comparison(profits, labels=timeframes)

if __name__ == '__main__':
    # Example usage:
    # Replace with your actual Binance API keys
    API_KEY = "your_api_key_here"
    SECRET_KEY = "your_secret_key_here"
    
    main(api_key=API_KEY, secret_key=SECRET_KEY)
