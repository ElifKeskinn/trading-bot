import React from 'react';
import TradeTable from './TradeTable';

const TradesSection = ({ trades, handleFetchResults, isLoading }) => {
    return (
        <section className="trades-section bg-white shadow-md rounded p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Trades</h2>
            <button
                onClick={handleFetchResults}
                className="mb-4 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition duration-300 flex items-center"
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
            {trades.length > 0 && <TradeTable trades={trades} />}
        </section>
    );
};

export default TradesSection;
