import axios from 'axios';

const ip_address = process.env.REACT_APP_API_URL || '192.168.1.48';

export const createSession = async (sessionId: string) => {
    return axios.post(`http://${ip_address}:2025/api/session/create/${sessionId}`);
};

export const fetchSessions = async () => {
    return axios.get(`http://${ip_address}:2025/api/sessions`);
};

export const fetchQrCode = async (id: string) => {
    return axios.get(`http://${ip_address}:2025/api/session/${id}`);
};

export const sendMessage = async (sessionId: string, messageData: { to: string; message: string }) => {
    return axios.post(`http://${ip_address}:2025/api/send/${sessionId}`, messageData);
};

export const deleteSession = async (id: string) => {
    return axios.delete(`http://${ip_address}:2025/api/session/${id}`);
};
