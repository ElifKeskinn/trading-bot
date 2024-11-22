import React from 'react';
import TradeTable from './TradeTable';
import { Bar } from 'react-chartjs-2';

const BacktestSection = ({ backtestResults, profitData, labels, handleRunBacktest, isLoading }) => {
    return (
        <section className="backtest-section bg-white shadow-md rounded p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Backtest</h2>
            <button
                onClick={handleRunBacktest}
                className="mb-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition duration-300 flex items-center"
                disabled={isLoading}
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
                ) : null}
                {isLoading ? 'Running...' : 'Run Backtest'}
            </button>
            {Object.keys(backtestResults).length > 0 && (
                <div>
                    <h3 className="text-xl font-semibold mb-2">Backtest Results</h3>
                    {Object.entries(backtestResults).map(([timeframe, result]) => (
                        <div key={timeframe} className="timeframe-result mb-6">
                            <h4 className="text-lg font-medium mb-1">{timeframe} Timeframe</h4>
                            <p className="mb-2">Profit: {result.profit.toFixed(2)} USDT</p>
                            <TradeTable trades={result.trades} />
                        </div>
                    ))}
                    <h3 className="text-xl font-semibold mb-2">Profit Comparison</h3>
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
                            responsive: true,
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
    );
};

export default BacktestSection;
