import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AtSign } from 'lucide-react';

interface User {
  id: string;
  name: string;
  avatarUrl?: string;
}

interface MentionAutocompleteProps {
  users: User[];
  onSelect: (user: User) => void;
  trigger: string; // The text after @
  isOpen: boolean;
  onClose: () => void;
  inputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement>;
}

export function MentionAutocomplete({
  users,
  onSelect,
  trigger,
  isOpen,
  onClose,
  inputRef
}: MentionAutocompleteProps) {
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter users based on trigger text
  useEffect(() => {
    if (!trigger) {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user =>
        user.name.toLowerCase().includes(trigger.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
    setSelectedIndex(0);
  }, [trigger, users]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || filteredUsers.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev =>
            prev < filteredUsers.length - 1 ? prev + 1 : 0
          );
          break;

        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev =>
            prev > 0 ? prev - 1 : filteredUsers.length - 1
          );
          break;

        case 'Enter':
        case 'Tab':
          e.preventDefault();
          if (filteredUsers[selectedIndex]) {
            onSelect(filteredUsers[selectedIndex]);
          }
          break;

        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredUsers, selectedIndex, onSelect, onClose]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, inputRef]);

  // Calculate position relative to input
  const getPosition = () => {
    if (!inputRef.current) return { top: 0, left: 0 };

    const rect = inputRef.current.getBoundingClientRect();
    return {
      top: rect.top - 200, // Above the input
      left: rect.left
    };
  };

  if (!isOpen || filteredUsers.length === 0) return null;

  const position = getPosition();

  return (
    <AnimatePresence>
      <motion.div
        ref={dropdownRef}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.15 }}
        className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 max-h-48 overflow-y-auto"
        style={{
          top: position.top,
          left: position.left,
          minWidth: '250px'
        }}
      >
        {/* Header */}
        <div className="px-3 py-2 border-b border-gray-100 bg-gray-50 sticky top-0">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
            <AtSign className="w-3 h-3" />
            <span>Mention someone</span>
          </div>
        </div>

        {/* User list */}
        <div className="py-1">
          {filteredUsers.map((user, index) => (
            <button
              key={user.id}
              onClick={() => onSelect(user)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`
                w-full px-3 py-2 flex items-center gap-3 transition-colors text-left
                ${index === selectedIndex
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'}
              `}
            >
              {/* Avatar */}
              <div className="flex-shrink-0">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-gray-500">@{user.name.toLowerCase().replace(/\s+/g, '')}</p>
              </div>

              {/* Selected indicator */}
              {index === selectedIndex && (
                <div className="flex-shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Footer hint */}
        <div className="px-3 py-2 border-t border-gray-100 bg-gray-50 sticky bottom-0">
          <p className="text-xs text-gray-500">
            <kbd className="px-1 py-0.5 bg-white border border-gray-300 rounded text-xs">↑↓</kbd> to navigate
            {' • '}
            <kbd className="px-1 py-0.5 bg-white border border-gray-300 rounded text-xs">Enter</kbd> to select
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
