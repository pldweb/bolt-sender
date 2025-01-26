import { useState, useEffect } from 'react';
import axios from 'axios';
import { QRCodeCanvas } from 'qrcode.react';
import { QRCode } from 'react-qr-code';


function App() {
  const [sessions, setSessions] = useState([]);
  const [qrCode, setQrCode] = useState(null);
  const [sessionId, setSessionId] = useState('');
  const [messageData, setMessageData] = useState({ to: '', message: '' });
  // const [refreshInterval, setRefreshInterval] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);


  // create sesi
  const createSession = async () => {
    try {
      const response = await axios.post(`http://192.168.100.89:2025/api/session/create/${sessionId}`);
      if (response.data.success) {
        fetchQrCode(sessionId);
        fetchSessions();
        setSessionId('');
      } else {
        alert(response.data.message);
      }
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await axios.get('http://192.168.100.89:2025/api/sessions');
      setSessions(response.data || []);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    }
  };

  // Fetch QR
  const fetchQrCode = async (id: any) => {
    let retries = 10; // Coba 10 kali
    const delay = (ms: any) => new Promise((resolve) => setTimeout(resolve, ms));

    while (retries > 0) {
      try {
        const response = await axios.get(`http://192.168.100.89:2025/api/session/${id}`);
        if (response.data.success) {
          if (response.data.data.qr) {
            setQrCode(response.data.data.qr); // QR Code ditemukan, set state
            console.log('QR Code fetched:', response.data);
            return; // Keluar dari loop
          }
          console.log('QR Code not ready, retrying...');
        }
        await delay(1000); // Tunggu 1 detik sebelum mencoba lagi
        retries--;
      } catch (error) {
        console.error('Failed to fetch QR Code:', error);
        return;
      }
    }

    // try {
    //   console.log(sessionId)
    //   const response = await axios.get(`http://192.168.100.89:2025/api/session/${sessionId}`);
    //   if (response.data.success) {
    //     setQrCode(response.data.qr);
    //     console.log('Berhasil ambil QR Code', response.data);
    //   }
    // } catch (error) {
    //   console.error('Failed to fetch QR Code:', error);
    // }
  };

  // Send Message
  const sendMessage = async () => {
    try {
      const response = await axios.post(`http://192.168.100.89:2025/api/send/${sessionId}`, messageData);
      if (response.data.success) {
        alert('Message sent successfully!');
        setMessageData({ to: '', message: '' });
      } else {
        alert(response.data.message);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  // Delete Sesi
  const deleteSession = async (id: any) => {
    try {
      const response = await axios.delete(`http://192.168.100.89:2025/api/session/${id}`);
      if (response.data.success) {
        fetchSessions();
      } else {
        alert(response.data.message);
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };


  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    console.log('QR Code state updated:', qrCode); // Log saat state berubah
  }, [qrCode]);

  useEffect(() => {
    if (refreshInterval) clearInterval(refreshInterval); // Clear previous interval if any
    const interval = setInterval(() => {
      if (sessionId) fetchQrCode(sessionId);
    }, 60000); // 1 minute interval
    setRefreshInterval(interval); // Store the interval id
    return () => clearInterval(interval); // Cleanup on unmount
  }, [sessionId]);

  return (
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">WhatsApp API Gateway</h1>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="bg-white p-6 shadow rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Manage Sessions</h2>
            <input
                type="text"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                placeholder="Enter session ID"
                className="border p-2 rounded mb-4 w-full"
            />
            <button
                onClick={createSession}
                className="bg-green-500 text-white px-4 py-2 rounded mr-2">
              Create Session
            </button>

            {qrCode ? (
                <div>
                  <h3 className="text-lg font-medium mt-4">Scan QR Code:</h3>
                  <QRCode value={qrCode} size={256} />
                </div>
            ) : (
                <p className="text-gray-500 mt-4">No QR Code available. Create a session first.</p>
            )}

            <h2 className="text-2xl font-bold mt-6 mb-4">Active Sessions</h2>
            <ul>
              {Array.isArray(sessions) && sessions.length > 0 ? (
                  sessions.map((session) => (
                      <li key={session.id} className="flex justify-between items-center mb-2">
                        <span>{session.id} - {session.status}</span>
                        <button
                            onClick={() => deleteSession(session.id)}
                            className="bg-red-500 text-white px-4 py-2 rounded">
                          Delete
                        </button>
                      </li>
                  ))
              ) : (
                  <li className="text-gray-500">No active sessions available.</li>
              )}
            </ul>


            <h2 className="text-2xl font-bold mt-6 mb-4">Send Message</h2>
            <input
                type="text"
                value={messageData.to}
                onChange={(e) => setMessageData({...messageData, to: e.target.value})}
                placeholder="Recipient Number"
                className="border p-2 rounded mb-2 w-full"
            />
            <textarea
                value={messageData.message}
                onChange={(e) => setMessageData({...messageData, message: e.target.value})}
                placeholder="Message"
                className="border p-2 rounded mb-2 w-full"
            />
            <button
                onClick={sendMessage}
                className="bg-blue-500 text-white px-4 py-2 rounded">
              Send Message
            </button>
          </div>
        </main>
      </div>
  );
}

export default App;
