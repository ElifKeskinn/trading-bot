import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api'; // Flask backend'inizin çalıştığı URL

export const startBot = (payload) => {
    return axios.post(`${API_BASE_URL}/start_bot`, payload, {
        headers: {
            'Content-Type': 'application/json'
        }
    });
};

export const stopBot = () => {
    return axios.post(`${API_BASE_URL}/stop_bot`, {}, {
        headers: {
            'Content-Type': 'application/json'
        }
    });
};

export const runBacktest = (payload) => {
    return axios.post(`${API_BASE_URL}/backtest`, payload, {
        headers: {
            'Content-Type': 'application/json'
        }
    });
};

export const fetchTrades = () => {
    return axios.get(`${API_BASE_URL}/get_trades`);
};

export const fetchProfit = () => {
    return axios.get(`${API_BASE_URL}/get_profit`);
};

export const fetchResults = () => {
    return axios.get(`${API_BASE_URL}/get_results`);
};
