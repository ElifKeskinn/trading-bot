import React from 'react';
import { PlayIcon, StopIcon } from '@heroicons/react/24/solid';

const BotControls = ({
    symbol,
    setSymbol,
    historicalDays,
    setHistoricalDays,
    timeframes,
    setTimeframes,
    initialCapital,
    setInitialCapital,
    handleStartBot,
    handleStopBot,
    botStatus,
    isLoading
}) => {
    return (
        <section className="bot-controls bg-white shadow-md rounded p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Bot Controls</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="form-group">
                    <label className="block text-gray-700">Symbol:</label>
                    <input
                        type="text"
                        value={symbol}
                        onChange={(e) => setSymbol(e.target.value)}
                        className="mt-1 p-2 w-full border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="ETHUSDT"
                    />
                </div>
                <div className="form-group">
                    <label className="block text-gray-700">Historical Days:</label>
                    <input
                        type="number"
                        value={historicalDays}
                        onChange={(e) => setHistoricalDays(e.target.value)}
                        className="mt-1 p-2 w-full border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="1"
                    />
                </div>
                <div className="form-group">
                    <label className="block text-gray-700">Timeframes (comma separated):</label>
                    <input
                        type="text"
                        value={timeframes.join(',')}
                        onChange={(e) => setTimeframes(e.target.value.split(',').map(tf => tf.trim()))}
                        className="mt-1 p-2 w-full border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="5m, 1h"
                    />
                </div>
                <div className="form-group">
                    <label className="block text-gray-700">Initial Capital (USDT):</label>
                    <input
                        type="number"
                        value={initialCapital}
                        onChange={(e) => setInitialCapital(e.target.value)}
                        className="mt-1 p-2 w-full border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="1"
                    />
                </div>
            </div>
            <div className="button-group flex space-x-4">
                <button
                    onClick={handleStartBot}
                    disabled={botStatus || isLoading}
                    className={`flex items-center px-4 py-2 rounded text-white ${
                        botStatus || isLoading
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-500 hover:bg-blue-600'
                    } transition duration-300`}
                >
                    {isLoading ? (
                        <svg
                            className="animate-spin h-5 w-5 mr-3 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            ></circle>
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8v8H4z"
                            ></path>
                        </svg>
                    ) : (
                        <PlayIcon className="h-5 w-5 mr-2" />
                    )}
                    {isLoading ? 'Starting...' : 'Start Bot'}
                </button>
                <button
                    onClick={handleStopBot}
                    disabled={!botStatus || isLoading}
                    className={`flex items-center px-4 py-2 rounded text-white ${
                        !botStatus || isLoading
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-red-500 hover:bg-red-600'
                    } transition duration-300`}
                >
                    {isLoading ? (
                        <svg
                            className="animate-spin h-5 w-5 mr-3 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            ></circle>
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8v8H4z"
                            ></path>
                        </svg>
                    ) : (
                        <StopIcon className="h-5 w-5 mr-2" />
                    )}
                    {isLoading ? 'Stopping...' : 'Stop Bot'}
                </button>
            </div>
        </section>
    );
};

export default BotControls;
