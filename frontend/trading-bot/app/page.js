'use client';

import { useState, useEffect } from 'react';
import { startBot, stopBot, runBacktest, fetchTrades, fetchProfit, fetchBotStatus } from '../services/api';
import BotControls from '../components/BotControls';
import BacktestSection from '../components/BacktestSection';
import TradesSection from '../components/TradesSection';
import ProfitDataSection from '../components/ProfitDataSection';
import ErrorAlert from '../components/ErrorAlert';
import { toast } from 'react-toastify';
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
    const [isLoading, setIsLoading] = useState(false);

    // Bot durumunu kontrol etmek için
    useEffect(() => {
        const checkBotStatus = async () => {
            try {
                const response = await fetchBotStatus();
                setBotStatus(response.data.bot_running);
            } catch (error) {
                console.error('Error fetching bot status:', error);
                setError('Error fetching bot status.');
            }
        };

        checkBotStatus();
    }, []);

    const handleStartBot = async () => {
        setIsLoading(true);
        try {
            const payload = { symbol, historical_days: historicalDays, timeframes, initial_capital: initialCapital };
            const response = await startBot(payload);
            toast.success(response.data.message);
            setBotStatus(true);
        } catch (error) {
            console.error(error);
            if (error.response?.status === 400 && error.response.data.message === "Bot is already running.") {
                toast.info("Bot is already running.");
                setBotStatus(true);
            } else {
                toast.error(error.response?.data?.message || 'Error starting bot.');
                setError(error.response?.data?.message || 'Error starting bot.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleStopBot = async () => {
        setIsLoading(true);
        try {
            const response = await stopBot();
            toast.success(response.data.message);
            setBotStatus(false);
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Error stopping bot.');
            setError(error.response?.data?.message || 'Error stopping bot.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRunBacktest = async () => {
        setIsLoading(true);
        try {
            const payload = { symbol, historical_days: historicalDays, timeframes, initial_capital: initialCapital };
            const response = await runBacktest(payload);
            setBacktestResults(response.data);
            // Profit verilerini güncelle
            const profits = response.data.profits || [];
            setProfitData(profits);
            const labels = Object.keys(response.data).filter(key => key !== 'trades').map(tf => tf); // Zaman dilimlerini etiket olarak al
            setLabels(labels);
            toast.success('Backtest completed successfully.');
        } catch (error) {
            console.error(error);
            toast.error('Error running backtest.');
            setError('Error running backtest.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleFetchResults = async () => {
        setIsLoading(true);
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

            toast.success('Results fetched successfully.');
        } catch (error) {
            console.error(error);
            toast.error('Error fetching results.');
            setError('Error fetching results.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="dashboard-container">
            <h1 className="text-4xl font-bold text-center mb-8">Crypto Trading Bot Dashboard</h1>

            <ErrorAlert error={error} />

            <BotControls
                symbol={symbol}
                setSymbol={setSymbol}
                historicalDays={historicalDays}
                setHistoricalDays={setHistoricalDays}
                timeframes={timeframes}
                setTimeframes={setTimeframes}
                initialCapital={initialCapital}
                setInitialCapital={setInitialCapital}
                handleStartBot={handleStartBot}
                handleStopBot={handleStopBot}
                botStatus={botStatus}
                isLoading={isLoading}
            />

            <BacktestSection
                backtestResults={backtestResults}
                profitData={profitData}
                labels={labels}
                handleRunBacktest={handleRunBacktest}
                isLoading={isLoading}
            />

            <TradesSection
                trades={trades}
                handleFetchResults={handleFetchResults}
                isLoading={isLoading}
            />

            <ProfitDataSection
                profitData={profitData}
                labels={labels}
                handleFetchResults={handleFetchResults}
                isLoading={isLoading}
            />
        </div>
    );
}
