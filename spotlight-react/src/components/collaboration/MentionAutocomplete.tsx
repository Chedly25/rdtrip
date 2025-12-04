/**
 * Mention Autocomplete - "The Address Book"
 *
 * A vintage address book style dropdown for mentioning collaborators.
 * Features passport-style avatars, typewriter text, and editorial styling.
 *
 * Design: Wanderlust Editorial with vintage address book aesthetics
 */

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AtSign } from 'lucide-react';

// =============================================================================
// WANDERLUST EDITORIAL COLOR PALETTE
// =============================================================================
const colors = {
  cream: '#FFFBF5',
  warmWhite: '#FAF7F2',
  terracotta: '#C45830',
  terracottaLight: '#D96A42',
  golden: '#D4A853',
  goldenLight: '#E4BE73',
  goldenDark: '#B8923D',
  sage: '#6B8E7B',
  espresso: '#2C1810',
  mediumBrown: '#5C4033',
  lightBrown: '#8B7355',
  parchment: '#F5E6C8',
};

interface User {
  id: string;
  name: string;
  avatarUrl?: string;
}

interface MentionAutocompleteProps {
  users: User[];
  onSelect: (user: User) => void;
  trigger: string;
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
  inputRef,
}: MentionAutocompleteProps) {
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!trigger) {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter((user) =>
        user.name.toLowerCase().includes(trigger.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
    setSelectedIndex(0);
  }, [trigger, users]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || filteredUsers.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev < filteredUsers.length - 1 ? prev + 1 : 0));
          break;

        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredUsers.length - 1));
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

  const getPosition = () => {
    if (!inputRef.current) return { top: 0, left: 0 };

    const rect = inputRef.current.getBoundingClientRect();
    return {
      top: rect.top - 200,
      left: rect.left,
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
        style={{
          position: 'fixed',
          zIndex: 50,
          top: position.top,
          left: position.left,
          minWidth: '260px',
          background: `linear-gradient(180deg, ${colors.cream} 0%, ${colors.warmWhite} 100%)`,
          borderRadius: '12px',
          border: `2px solid ${colors.golden}`,
          boxShadow: `0 12px 32px rgba(44, 24, 16, 0.25)`,
          overflow: 'hidden',
          maxHeight: '200px',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '10px 14px',
            borderBottom: `1px solid ${colors.golden}`,
            background: `${colors.parchment}50`,
            position: 'sticky',
            top: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <AtSign style={{ width: 12, height: 12, color: colors.terracotta }} />
            <span
              style={{
                fontFamily: '"Courier New", monospace',
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '1px',
                color: colors.mediumBrown,
                textTransform: 'uppercase',
              }}
            >
              Address Book
            </span>
          </div>
        </div>

        {/* User list */}
        <div style={{ overflowY: 'auto', maxHeight: '140px' }}>
          {filteredUsers.map((user, index) => (
            <motion.button
              key={user.id}
              onClick={() => onSelect(user)}
              onMouseEnter={() => setSelectedIndex(index)}
              whileHover={{ x: 2 }}
              style={{
                width: '100%',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: index === selectedIndex ? `${colors.golden}20` : 'transparent',
                border: 'none',
                borderLeft: index === selectedIndex ? `3px solid ${colors.terracotta}` : '3px solid transparent',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              {/* Passport-style avatar */}
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '4px',
                  flexShrink: 0,
                  overflow: 'hidden',
                  border: `2px solid ${index === selectedIndex ? colors.terracotta : colors.golden}`,
                }}
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      background: `linear-gradient(135deg, ${colors.golden} 0%, ${colors.goldenDark} 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: '"Courier New", monospace',
                      fontSize: '13px',
                      fontWeight: 700,
                      color: colors.cream,
                    }}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Name */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontFamily: 'Georgia, serif',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: index === selectedIndex ? colors.espresso : colors.mediumBrown,
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {user.name}
                </p>
                <p
                  style={{
                    fontFamily: '"Courier New", monospace',
                    fontSize: '10px',
                    color: colors.lightBrown,
                    margin: 0,
                  }}
                >
                  @{user.name.toLowerCase().replace(/\s+/g, '')}
                </p>
              </div>

              {/* Selection indicator */}
              {index === selectedIndex && (
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: colors.terracotta,
                    flexShrink: 0,
                  }}
                />
              )}
            </motion.button>
          ))}
        </div>

        {/* Footer hint */}
        <div
          style={{
            padding: '8px 14px',
            borderTop: `1px solid ${colors.golden}`,
            background: `${colors.parchment}40`,
            position: 'sticky',
            bottom: 0,
          }}
        >
          <p
            style={{
              fontFamily: '"Courier New", monospace',
              fontSize: '9px',
              color: colors.lightBrown,
              margin: 0,
            }}
          >
            <kbd
              style={{
                padding: '2px 4px',
                background: colors.warmWhite,
                border: `1px solid ${colors.golden}`,
                borderRadius: '3px',
                fontFamily: '"Courier New", monospace',
                fontSize: '9px',
              }}
            >
              ↑↓
            </kbd>{' '}
            navigate •{' '}
            <kbd
              style={{
                padding: '2px 4px',
                background: colors.warmWhite,
                border: `1px solid ${colors.golden}`,
                borderRadius: '3px',
                fontFamily: '"Courier New", monospace',
                fontSize: '9px',
              }}
            >
              Enter
            </kbd>{' '}
            select
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
