/**
 * useKeyboardShortcuts - Power User Keyboard Shortcuts
 * Phase 6.6: Cmd+K, Cmd+S, Cmd+E, Cmd+/, Esc, Arrow keys
 */

import { useEffect } from 'react';

interface KeyboardShortcut {
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  handler: (event: KeyboardEvent) => void;
  description: string;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[]) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const metaOrCtrl = shortcut.metaKey
          ? (event.metaKey || event.ctrlKey) // Support both Cmd (Mac) and Ctrl (Windows)
          : !event.metaKey && !event.ctrlKey;

        const shiftMatch = shortcut.shiftKey
          ? event.shiftKey
          : !event.shiftKey;

        if (
          event.key === shortcut.key &&
          metaOrCtrl &&
          shiftMatch
        ) {
          event.preventDefault();
          shortcut.handler(event);
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};

/**
 * Global keyboard shortcuts for Spotlight
 */
export const useSpotlightKeyboardShortcuts = (
  onSave?: () => void,
  onExport?: () => void,
  onToggleSuggestions?: () => void,
  onEscape?: () => void
) => {
  const shortcuts: KeyboardShortcut[] = [
    {
      key: 's',
      metaKey: true,
      handler: () => {
        console.log('⌨️ Keyboard: Save (Cmd+S)');
        onSave?.();
      },
      description: 'Save trip',
    },
    {
      key: 'e',
      metaKey: true,
      handler: () => {
        console.log('⌨️ Keyboard: Export (Cmd+E)');
        onExport?.();
      },
      description: 'Open export menu',
    },
    {
      key: '/',
      metaKey: true,
      handler: () => {
        console.log('⌨️ Keyboard: Toggle Suggestions (Cmd+/)');
        onToggleSuggestions?.();
      },
      description: 'Toggle agent suggestions panel',
    },
    {
      key: 'Escape',
      handler: () => {
        console.log('⌨️ Keyboard: Close (Esc)');
        onEscape?.();
      },
      description: 'Close modals and panels',
    },
  ];

  useKeyboardShortcuts(shortcuts);
};
