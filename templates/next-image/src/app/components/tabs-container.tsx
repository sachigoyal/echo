'use client';

import { useState } from 'react';
import Chat from './chat';
import ImageGenerator from './image';

export default function TabsContainer() {
  const [activeTab, setActiveTab] = useState<'chat' | 'image'>('chat');

  return (
    <div className="w-full flex flex-col h-full">
      {/* Tab Navigation */}
      <div className="flex border-b mb-6">
        <button
          onClick={() => setActiveTab('chat')}
          className={`px-6 py-3 font-mono text-sm border-b-2 transition-colors tracking-wide ${
            activeTab === 'chat'
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Chat
        </button>
        <button
          onClick={() => setActiveTab('image')}
          className={`px-6 py-3 font-mono text-sm border-b-2 transition-colors tracking-wide ${
            activeTab === 'image'
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Image Generation
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex-1 flex flex-col overflow-hidden">
        <div
          className={`flex-1 flex flex-col overflow-hidden ${activeTab === 'chat' ? '' : 'hidden'}`}
        >
          <div className="mb-6 pb-3 border-b border-gray-100 flex-shrink-0">
            <h2 className="text-xl font-mono tracking-tight text-gray-800 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></span>
              Chat
            </h2>
            <p className="text-sm text-gray-500 mt-1 ml-5">
              Conversation with AI assistant
            </p>
          </div>
          <div className="flex-1 flex flex-col min-h-0">
            <Chat />
          </div>
        </div>
        <div className={`${activeTab === 'image' ? '' : 'hidden'}`}>
          <div className="mb-6 pb-3 border-b border-gray-100">
            <h2 className="text-xl font-mono tracking-tight text-gray-800 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-gradient-to-b from-purple-500 to-purple-600 rounded-full"></span>
              Image Generation
            </h2>
            <p className="text-sm text-gray-500 mt-1 ml-5">
              Create images from text descriptions
            </p>
          </div>
          <ImageGenerator />
        </div>
      </div>
    </div>
  );
}
