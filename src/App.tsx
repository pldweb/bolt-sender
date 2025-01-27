import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import QRCode from 'react-qr-code';
import { MessageSquare, Trash2, Edit2, Plus, Check, X, Image, Send } from 'lucide-react';

function App() {
  const [sessions, setSessions] = useState<Record<string, any>>({});
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState('');
  const [messageData, setMessageData] = useState({ to: '', message: '' });
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [selectedSession, setSelectedSession] = useState('');
  const [editingSession, setEditingSession] = useState<string | null>(null);
  const [newSessionName, setNewSessionName] = useState('');
  const [showNewNumberModal, setShowNewNumberModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ip_address = '192.168.100.89';
  const API_BASE = `http://${ip_address}:2025/api`;

  const createSession = async () => {
    if (!sessionId.trim()) {
      alert('Please enter a session name');
      return;
    }

    try {
      const response = await axios.post(`${API_BASE}/session/create/${sessionId}`);
      if (response.data.success) {
        fetchQrCode(sessionId);
        fetchSessions();
        setSelectedSession(sessionId);
        setSessionId('');
        setShowNewNumberModal(false);
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

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('Image size should be less than 5MB');
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const sendMessage = async () => {
    if (!selectedSession) {
      alert('Please select a session first');
      return;
    }

    if (!messageData.to) {
      alert('Please enter recipient number');
      return;
    }

    if (!messageData.message && !selectedImage) {
      alert('Please enter a message or select an image');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('to', messageData.to);
      if (messageData.message) {
        formData.append('message', messageData.message);
      }
      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      const response = await axios.post(`${API_BASE}/send/${selectedSession}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        alert('Message sent successfully!');
        setMessageData({ to: '', message: '' });
        removeSelectedImage();
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

  const startEditingSession = (id: string, currentName: string) => {
    setEditingSession(id);
    setNewSessionName(currentName);
  };

  const updateSessionName = async (oldId: string) => {
    if (!newSessionName.trim() || newSessionName === oldId) {
      setEditingSession(null);
      return;
    }

    try {
      // First create a new session with the new name
      const createResponse = await axios.post(`${API_BASE}/session/create/${newSessionName}`);
      if (createResponse.data.success) {
        // Then delete the old session
        await deleteSession(oldId);
        setEditingSession(null);
        fetchSessions();
        if (selectedSession === oldId) {
          setSelectedSession(newSessionName);
        }
      }
    } catch (error) {
      console.error('Failed to update session name:', error);
      alert('Failed to update session name. Please try again.');
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
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold">Manage Numbers</h2>
                  <button
                      onClick={() => setShowNewNumberModal(true)}
                      className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition-colors">
                    <Plus className="h-5 w-5" />
                    Add New Number
                  </button>
                </div>

                {showNewNumberModal && (
                    <div className="mb-4">
                      <div className="flex gap-2">
                        <input
                            type="text"
                            value={sessionId}
                            onChange={(e) => setSessionId(e.target.value)}
                            placeholder="Enter number name"
                            className="flex-1 border border-gray-300 p-2 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                        <button
                            onClick={createSession}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition-colors">
                          Create
                        </button>
                        <button
                            onClick={() => {
                              setShowNewNumberModal(false);
                              setSessionId('');
                            }}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors">
                          Cancel
                        </button>
                      </div>
                    </div>
                )}

                <div className="space-y-2">
                  {Object.entries(sessions).length > 0 ? (
                      Object.entries(sessions).map(([id, data]: [string, any]) => (
                          <div key={id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                            <div className="flex-1">
                              {editingSession === id ? (
                                  <div className="flex gap-2 items-center">
                                    <input
                                        type="text"
                                        value={newSessionName}
                                        onChange={(e) => setNewSessionName(e.target.value)}
                                        className="border border-gray-300 p-1 rounded flex-1"
                                    />
                                    <button
                                        onClick={() => updateSessionName(id)}
                                        className="text-green-500 hover:text-green-600">
                                      <Check className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={() => setEditingSession(null)}
                                        className="text-red-500 hover:text-red-600">
                                      <X className="h-5 w-5" />
                                    </button>
                                  </div>
                              ) : (
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{id}</span>
                                    <span className={`px-2 py-1 text-xs rounded ${
                                        data.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                              {data.status}
                            </span>
                                  </div>
                              )}
                            </div>
                            <div className="flex gap-2 ml-4">
                              <button
                                  onClick={() => {
                                    setSelectedSession(id);
                                    fetchQrCode(id);
                                  }}
                                  className="text-blue-500 hover:text-blue-600 px-3 py-1 rounded">
                                Select
                              </button>
                              {!editingSession && (
                                  <button
                                      onClick={() => startEditingSession(id, id)}
                                      className="text-gray-500 hover:text-gray-600">
                                    <Edit2 className="h-5 w-5" />
                                  </button>
                              )}
                              <button
                                  onClick={() => deleteSession(id)}
                                  className="text-red-500 hover:text-red-600">
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                      ))
                  ) : (
                      <p className="text-gray-500">No active numbers available.</p>
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

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded transition-colors">
                              <Image className="h-5 w-5" />
                              Add Image
                            </button>
                            {imagePreview && (
                                <button
                                    onClick={removeSelectedImage}
                                    className="text-red-500 hover:text-red-600">
                                  <X className="h-5 w-5" />
                                </button>
                            )}
                          </div>
                          <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleImageSelect}
                              className="hidden"
                          />
                          {imagePreview && (
                              <div className="relative inline-block">
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="max-w-xs rounded-lg shadow-md"
                                />
                              </div>
                          )}
                        </div>

                        <button
                            onClick={sendMessage}
                            className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors">
                          <Send className="h-5 w-5" />
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