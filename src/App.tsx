import React from 'react';
import { MessageSquare } from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <MessageSquare className="h-8 w-8 text-green-500 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">
              WhatsApp API Gateway
            </h1>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white overflow-hidden shadow rounded-lg p-6">
            <p className="text-gray-500">
              Please check the README.md file for instructions on setting up the WhatsApp API Gateway backend.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;