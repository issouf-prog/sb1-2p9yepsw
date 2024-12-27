import React from 'react';
import { Header } from './components/Header';
import { VideoGenerator } from './components/VideoGenerator';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <Header />
        <VideoGenerator />
      </div>
    </div>
  );
}

export default App;