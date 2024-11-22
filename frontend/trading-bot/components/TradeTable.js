import React from 'react';

const TradeTable = ({ trades }) => {
    if (!trades || trades.length === 0) {
        return <p className="text-gray-600">No trades available.</p>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full bg-white border">
                <thead>
                    <tr>
                        <th className="py-2 px-4 border-b">Type</th>
                        <th className="py-2 px-4 border-b">Price (USDT)</th>
                        <th className="py-2 px-4 border-b">Date</th>
                        <th className="py-2 px-4 border-b">Profit (USDT)</th>
                        <th className="py-2 px-4 border-b">Reason</th>
                    </tr>
                </thead>
                <tbody>
                    {trades.map((trade, index) => (
                        <tr key={index} className="hover:bg-gray-100">
                            <td className="py-2 px-4 border-b">{trade.Type}</td>
                            <td className="py-2 px-4 border-b">{trade.Price}</td>
                            <td className="py-2 px-4 border-b">{new Date(trade.Date).toLocaleString()}</td>
                            <td className="py-2 px-4 border-b">
                                {trade.Profit !== undefined ? trade.Profit.toFixed(2) : '-'}
                            </td>
                            <td className="py-2 px-4 border-b">
                                {trade.Reason || '-'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default TradeTable;
