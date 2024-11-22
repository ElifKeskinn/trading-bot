'use client';

import { useState, useEffect } from 'react';
import { startBot, stopBot, runBacktest, fetchTrades, fetchProfit, fetchBotStatus } from '../services/api';
import TradeTable from '../components/TradeTable';
import { Bar } from 'react-chartjs-2';
import 'chart.js/auto';

export default function Dashboard() {
    const [botStatus, setBotStatus] = useState(false);
    const [symbol, setSymbol] = useState('ETHUSDT');
    const [historicalDays, setHistoricalDays] = useState(60);
    const [timeframes, setTimeframes] = useState(['5m', '1h']);
    const [initialCapital, setInitialCapital] = useState(10000);
    const [backtestResults, setBacktestResults] = useState({});
    const [profitData, setProfitData] = useState([]);
    const [labels, setLabels] = useState([]);
    const [trades, setTrades] = useState([]);
    const [error, setError] = useState('');

    // Bot durumunu kontrol etmek için
    useEffect(() => {
        const checkBotStatus = async () => {
            try {
                const response = await fetchBotStatus();
                setBotStatus(response.data.bot_running);
            } catch (error) {
                console.error('Error fetching bot status:', error);
            }
        };

        checkBotStatus();
    }, []);

    const handleStartBot = async () => {
        try {
            const payload = { symbol, historical_days: historicalDays, timeframes, initial_capital: initialCapital };
            const response = await startBot(payload);
            alert(response.data.message);
            setBotStatus(true);
        } catch (error) {
            console.error(error);
            if (error.response?.status === 400 && error.response.data.message === "Bot is already running.") {
                alert("Bot is already running.");
                setBotStatus(true);
            } else {
                setError(error.response?.data?.message || 'Error starting bot.');
            }
        }
    };

    const handleStopBot = async () => {
        try {
            const response = await stopBot();
            alert(response.data.message);
            setBotStatus(false);
        } catch (error) {
            console.error(error);
            setError(error.response?.data?.message || 'Error stopping bot.');
        }
    };

    const handleRunBacktest = async () => {
        try {
            const payload = { symbol, historical_days: historicalDays, timeframes, initial_capital: initialCapital };
            const response = await runBacktest(payload);
            setBacktestResults(response.data);
            // Profit verilerini güncelle
            const profits = response.data.profits || [];
            setProfitData(profits);
            const labels = Object.keys(response.data).filter(key => key !== 'trades').map(tf => tf); // Zaman dilimlerini etiket olarak al
            setLabels(labels);
        } catch (error) {
            console.error(error);
            setError('Error running backtest.');
        }
    };

    const handleFetchResults = async () => {
        try {
            const [tradesResponse, profitResponse] = await Promise.all([
                fetchTrades(),
                fetchProfit()
            ]);

            if (tradesResponse.data) {
                const trades = tradesResponse.data.trades ? Object.values(tradesResponse.data.trades).flat() : [];
                setTrades(trades);
            }

            if (profitResponse.data) {
                const profits = profitResponse.data.profits || [];
                setProfitData(profits);
                const labels = profits.map((_, index) => `Timeframe ${index + 1}`); // Labels oluşturmak için
                setLabels(labels);
            }
        } catch (error) {
            console.error(error);
            setError('Error fetching results.');
        }
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <h1>Crypto Trading Bot Dashboard</h1>

            {error && <p style={{ color: 'red' }}>{error}</p>}

            <section style={{ marginBottom: '40px', border: '1px solid #ccc', padding: '20px', borderRadius: '5px' }}>
                <h2>Bot Controls</h2>
                <div style={{ marginBottom: '10px' }}>
                    <label style={{ marginRight: '10px' }}>Symbol:</label>
                    <input type="text" value={symbol} onChange={(e) => setSymbol(e.target.value)} />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label style={{ marginRight: '10px' }}>Historical Days:</label>
                    <input type="number" value={historicalDays} onChange={(e) => setHistoricalDays(e.target.value)} />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label style={{ marginRight: '10px' }}>Timeframes (comma separated):</label>
                    <input
                        type="text"
                        value={timeframes.join(',')}
                        onChange={(e) => setTimeframes(e.target.value.split(',').map(tf => tf.trim()))}
                    />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label style={{ marginRight: '10px' }}>Initial Capital (USDT):</label>
                    <input type="number" value={initialCapital} onChange={(e) => setInitialCapital(e.target.value)} />
                </div>
                <button onClick={handleStartBot} disabled={botStatus} style={{ marginRight: '10px' }}>
                    Start Bot
                </button>
                <button onClick={handleStopBot} disabled={!botStatus}>
                    Stop Bot
                </button>
            </section>

            <section style={{ marginBottom: '40px', border: '1px solid #ccc', padding: '20px', borderRadius: '5px' }}>
                <h2>Backtest</h2>
                <button onClick={handleRunBacktest} style={{ marginBottom: '20px' }}>Run Backtest</button>
                {Object.keys(backtestResults).length > 0 && (
                    <div>
                        <h3>Backtest Results</h3>
                        {Object.entries(backtestResults).map(([timeframe, result]) => (
                            <div key={timeframe} style={{ marginBottom: '20px' }}>
                                <h4>{timeframe} Timeframe</h4>
                                <p>Profit: {result.profit.toFixed(2)} USDT</p>
                                <TradeTable trades={result.trades} />
                            </div>
                        ))}
                        <h3>Profit Comparison</h3>
                        <Bar
                            data={{
                                labels: labels,
                                datasets: [
                                    {
                                        label: 'Profit/Loss (USDT)',
                                        data: profitData,
                                        backgroundColor: profitData.map(p => p > 0 ? 'rgba(75, 192, 192, 0.6)' : 'rgba(255, 99, 132, 0.6)'),
                                        borderColor: profitData.map(p => p > 0 ? 'rgba(75, 192, 192, 1)' : 'rgba(255, 99, 132, 1)'),
                                        borderWidth: 1,
                                    }
                                ]
                            }}
                            options={{
                                scales: {
                                    y: {
                                        beginAtZero: true
                                    }
                                }
                            }}
                        />
                    </div>
                )}
            </section>

            <section style={{ marginBottom: '40px', border: '1px solid #ccc', padding: '20px', borderRadius: '5px' }}>
                <h2>Trades</h2>
                <button onClick={handleFetchResults} style={{ marginBottom: '20px' }}>Fetch Trades & Profit Data</button>
                {trades.length > 0 && <TradeTable trades={trades} />}
            </section>

            <section style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '5px' }}>
                <h2>Profit Data</h2>
                <button onClick={handleFetchResults} style={{ marginBottom: '20px' }}>Fetch Trades & Profit Data</button>
                {profitData.length > 0 && (
                    <Bar
                        data={{
                            labels: labels,
                            datasets: [
                                {
                                    label: 'Profit/Loss (USDT)',
                                    data: profitData,
                                    backgroundColor: profitData.map(p => p > 0 ? 'rgba(75, 192, 192, 0.6)' : 'rgba(255, 99, 132, 0.6)'),
                                    borderColor: profitData.map(p => p > 0 ? 'rgba(75, 192, 192, 1)' : 'rgba(255, 99, 132, 1)'),
                                    borderWidth: 1,
                                }
                            ]
                        }}
                        options={{
                            scales: {
                                y: {
                                    beginAtZero: true
                                }
                            }
                        }}
                    />
                )}
            </section>
            </div>
        );
    }
