import React from 'react';
import { Bar } from 'react-chartjs-2';

const ProfitDataSection = ({ profitData, labels, handleFetchResults, isLoading }) => {
    return (
        <section className="profit-data-section bg-white shadow-md rounded p-6">
            <h2 className="text-2xl font-semibold mb-4">Profit Data</h2>
            <button
                onClick={handleFetchResults}
                className="mb-4 px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition duration-300 flex items-center"
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
                {isLoading ? 'Fetching...' : 'Fetch Trades & Profit Data'}
            </button>
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
                        responsive: true,
                        scales: {
                            y: {
                                beginAtZero: true
                            }
                        }
                    }}
                />
            )}
        </section>
    );
};

export default ProfitDataSection;
