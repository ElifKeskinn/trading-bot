import React from 'react';

const TradeTable = ({ trades }) => {
    if (!trades || trades.length === 0) {
        return <p>No trades available.</p>;
    }

    return (
        <table border="1" cellPadding="10" cellSpacing="0" style={{ width: '100%', marginTop: '20px' }}>
            <thead>
                <tr>
                    <th>Type</th>
                    <th>Price (USDT)</th>
                    <th>Date</th>
                    <th>Profit (USDT)</th>
                    <th>Reason</th>
                </tr>
            </thead>
            <tbody>
                {trades.map((trade, index) => (
                    <tr key={index}>
                        <td>{trade.Type}</td>
                        <td>{trade.Price}</td>
                        <td>{new Date(trade.Date).toLocaleString()}</td>
                        <td>{trade.Profit !== undefined ? trade.Profit.toFixed(2) : '-'}</td>
                        <td>{trade.Reason || '-'}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default TradeTable;
