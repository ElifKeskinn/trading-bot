import React from 'react';

const ErrorAlert = ({ error }) => {
    if (!error) return null;
    return (
        <div className="error-alert bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
            <span className="block sm:inline">{error}</span>
        </div>
    );
};

export default ErrorAlert;
