/**
 * ModalInput - Bottom input bar for the agent modal
 *
 * Features:
 * - Text input with auto-focus
 * - Send button with loading state
 * - Enter to send (Shift+Enter for newline)
 * - Disabled state during loading
 */

import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader } from 'lucide-react';
import { useAgent } from '../../contexts/AgentProvider';

export function ModalInput() {
  const { sendMessage, isLoading } = useAgent();
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle send message
  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const messageToSend = inputValue;
    setInputValue(''); // Clear immediately for better UX

    await sendMessage(messageToSend);
  };

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4 bg-white">
      <div className="flex items-center gap-3">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask me anything about your trip..."
          disabled={isLoading}
          className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-sm placeholder:text-gray-400"
        />
        <button
          onClick={handleSend}
          disabled={!inputValue.trim() || isLoading}
          className="p-3 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl transition-colors shadow-sm flex-shrink-0"
        >
          {isLoading ? (
            <Loader className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
}
