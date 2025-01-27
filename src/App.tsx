import { useState, useEffect } from 'react';
import axios from 'axios';
import QRCode from 'react-qr-code';
import { MessageSquare, Trash2 } from 'lucide-react';

function App() {
  const [sessions, setSessions] = useState<Record<string, any>>({});
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState('');
  const [messageData, setMessageData] = useState({ to: '', message: '' });
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [selectedSession, setSelectedSession] = useState('');

  const ip_address = '192.168.100.89';
  const API_BASE = `http://${ip_address}:2025/api`;

  const createSession = async () => {
    if (!sessionId.trim()) {
      alert('Please enter a session ID');
      return;
    }

    try {
      const response = await axios.post(`${API_BASE}/session/create/${sessionId}`);
      if (response.data.success) {
        fetchQrCode(sessionId);
        fetchSessions();
        setSelectedSession(sessionId);
        setSessionId('');
      } else {
        alert(response.data.message);
      }
    } catch (error) {
      console.error('Failed to create session:', error);
      alert('Failed to create session. Please try again.');
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await axios.get(`${API_BASE}/sessions`);
      if (response.data.success) {
        setSessions(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    }
  };

  const fetchQrCode = async (id: string) => {
    let retries = 10;
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    while (retries > 0) {
      try {
        const response = await axios.get(`${API_BASE}/session/${id}`);
        if (response.data.success) {
          if (response.data.data.qr) {
            setQrCode(response.data.data.qr);
            return;
          }
        }
        await delay(1000);
        retries--;
      } catch (error) {
        console.error('Failed to fetch QR Code:', error);
        return;
      }
    }
  };

  const sendMessage = async () => {
    if (!selectedSession) {
      alert('Please select a session first');
      return;
    }

    if (!messageData.to || !messageData.message) {
      alert('Please fill in both recipient number and message');
      return;
    }

    try {
      const response = await axios.post(`${API_BASE}/send/${selectedSession}`, messageData);
      if (response.data.success) {
        alert('Message sent successfully!');
        setMessageData({ to: '', message: '' });
      } else {
        alert(response.data.message);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  const deleteSession = async (id: string) => {
    try {
      const response = await axios.delete(`${API_BASE}/session/${id}`);
      if (response.data.success) {
        fetchSessions();
        if (selectedSession === id) {
          setSelectedSession('');
          setQrCode(null);
        }
      } else {
        alert(response.data.message);
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
      alert('Failed to delete session. Please try again.');
    }
  };

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (refreshInterval) clearInterval(refreshInterval);
    if (selectedSession) {
      const interval = setInterval(() => {
        fetchQrCode(selectedSession);
      }, 60000);
      setRefreshInterval(interval);
      return () => clearInterval(interval);
    }
  }, [selectedSession]);

  return (
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <MessageSquare className="h-8 w-8 text-green-500 mr-3" />
              <h1 className="text-3xl font-bold text-gray-900">WhatsApp API Gateway</h1>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="bg-white p-6 shadow rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-2xl font-bold mb-4">Manage Sessions</h2>
                <div className="flex gap-2 mb-4">
                  <input
                      type="text"
                      value={sessionId}
                      onChange={(e) => setSessionId(e.target.value)}
                      placeholder="Enter session ID"
                      className="flex-1 border border-gray-300 p-2 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <button
                      onClick={createSession}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition-colors">
                    Create Session
                  </button>
                </div>

                <h3 className="text-xl font-semibold mb-3">Active Sessions</h3>
                <div className="space-y-2">
                  {Object.entries(sessions).length > 0 ? (
                      Object.entries(sessions).map(([id, data]: [string, any]) => (
                          <div key={id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                            <div>
                              <span className="font-medium">{id}</span>
                              <span className={`ml-2 px-2 py-1 text-xs rounded ${
                                  data.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                          {data.status}
                        </span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                  onClick={() => {
                                    setSelectedSession(id);
                                    fetchQrCode(id);
                                  }}
                                  className="text-blue-500 hover:text-blue-600">
                                Select
                              </button>
                              <button
                                  onClick={() => deleteSession(id)}
                                  className="text-red-500 hover:text-red-600">
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                      ))
                  ) : (
                      <p className="text-gray-500">No active sessions available.</p>
                  )}
                </div>
              </div>

              <div>
                {selectedSession && (
                    <>
                      <h2 className="text-2xl font-bold mb-4">Send Message</h2>
                      <div className="space-y-3">
                        <input
                            type="text"
                            value={messageData.to}
                            onChange={(e) => setMessageData({...messageData, to: e.target.value})}
                            placeholder="Recipient Number (e.g., 6281234567890)"
                            className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <textarea
                            value={messageData.message}
                            onChange={(e) => setMessageData({...messageData, message: e.target.value})}
                            placeholder="Message"
                            rows={4}
                            className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                            onClick={sendMessage}
                            className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors">
                          Send Message
                        </button>
                      </div>
                    </>
                )}

                {qrCode && (
                    <div className="mt-6">
                      <h3 className="text-xl font-semibold mb-3">Scan QR Code</h3>
                      <div className="bg-white p-4 inline-block rounded-lg shadow">
                        <QRCode value={qrCode} size={256} level="L" />
                      </div>
                    </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
  );
}

export default App;