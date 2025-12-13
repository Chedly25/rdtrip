/**
 * CompanionInput
 *
 * Chat input for the planning companion with send button,
 * quick suggestions, and streaming state handling.
 *
 * Design: Wanderlust Editorial - warm earth tones, refined typography
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, X, Sparkles } from 'lucide-react';

// ============================================
// Types
// ============================================

interface CompanionInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  placeholder?: string;
  quickSuggestions?: string[];
  onCancel?: () => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

// ============================================
// Component
// ============================================

export function CompanionInput({
  onSend,
  isLoading,
  placeholder = 'Ask me anything about planning...',
  quickSuggestions = [],
  onCancel,
  disabled = false,
  autoFocus = false,
}: CompanionInputProps) {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus on mount if specified
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [message]);

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      const trimmedMessage = message.trim();
      if (trimmedMessage && !isLoading && !disabled) {
        onSend(trimmedMessage);
        setMessage('');
        // Reset textarea height
        if (inputRef.current) {
          inputRef.current.style.height = 'auto';
        }
      }
    },
    [message, isLoading, disabled, onSend]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Submit on Enter (without shift)
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleSuggestionClick = (suggestion: string) => {
    if (!isLoading && !disabled) {
      onSend(suggestion);
    }
  };

  return (
    <div className="space-y-3">
      {/* Quick suggestions */}
      <AnimatePresence>
        {quickSuggestions.length > 0 && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex flex-wrap gap-2"
          >
            {quickSuggestions.slice(0, 3).map((suggestion, index) => (
              <motion.button
                key={suggestion}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleSuggestionClick(suggestion)}
                disabled={disabled}
                className="
                  px-3 py-1.5 rounded-full
                  bg-[#FFFBF5] border border-[#E5DDD0]
                  text-xs text-[#8B7355] font-['Satoshi',sans-serif]
                  hover:border-[#C45830] hover:text-[#C45830] hover:bg-[#FEF3EE]
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-200
                  active:scale-[0.98]
                "
              >
                {suggestion}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="relative">
        <div
          className={`
            relative flex items-end gap-2
            bg-[#FAF7F2] border rounded-2xl
            transition-all duration-200
            ${
              isFocused
                ? 'border-[#C45830] ring-2 ring-[#C45830]/10'
                : 'border-[#E5DDD0]'
            }
            ${disabled ? 'opacity-60' : ''}
          `}
        >
          {/* Textarea input */}
          <textarea
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading || disabled}
            rows={1}
            className="
              flex-1 px-4 py-3
              bg-transparent
              font-['Satoshi',sans-serif] text-sm text-[#2C2417]
              placeholder:text-[#C4B8A5]
              focus:outline-none
              disabled:cursor-not-allowed
              resize-none
              min-h-[44px] max-h-[120px]
            "
          />

          {/* Action buttons */}
          <div className="flex items-center gap-1 pr-2 pb-2">
            {/* Cancel button (when streaming) */}
            <AnimatePresence>
              {isLoading && onCancel && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  type="button"
                  onClick={onCancel}
                  className="
                    w-8 h-8 rounded-lg
                    flex items-center justify-center
                    text-[#8B7355] hover:text-[#C45830] hover:bg-[#FEF3EE]
                    transition-colors
                  "
                  title="Cancel"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              )}
            </AnimatePresence>

            {/* Send button */}
            <button
              type="submit"
              disabled={!message.trim() || isLoading || disabled}
              className={`
                w-8 h-8 rounded-lg
                flex items-center justify-center
                transition-all duration-200
                ${
                  !message.trim() || isLoading || disabled
                    ? 'bg-[#E5DDD0] text-[#C4B8A5] cursor-not-allowed'
                    : 'bg-[#C45830] text-white hover:bg-[#A84828] active:scale-95'
                }
              `}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Character hint */}
        <AnimatePresence>
          {message.length > 200 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute -bottom-5 right-2 text-[10px] text-[#8B7355]"
            >
              {message.length}/500
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      {/* Streaming indicator */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-2 text-xs text-[#8B7355] font-['Satoshi',sans-serif]"
          >
            <div className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#C45830] animate-pulse" />
              <span>Thinking...</span>
            </div>
            <div className="flex gap-0.5">
              <motion.span
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                className="w-1 h-1 rounded-full bg-[#C45830]"
              />
              <motion.span
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                className="w-1 h-1 rounded-full bg-[#C45830]"
              />
              <motion.span
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                className="w-1 h-1 rounded-full bg-[#C45830]"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default CompanionInput;
