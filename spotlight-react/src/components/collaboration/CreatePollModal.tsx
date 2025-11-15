import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, AlertCircle } from 'lucide-react';
import type { PollOption } from '../../types';

interface CreatePollModalProps {
  routeId: string;
  dayNumber?: number;
  targetType?: string;
  targetId?: string;
  onClose: () => void;
  onPollCreated?: (poll: any) => void;
}

export function CreatePollModal({
  routeId,
  dayNumber,
  targetType,
  targetId,
  onClose,
  onPollCreated
}: CreatePollModalProps) {
  const [question, setQuestion] = useState('');
  const [description, setDescription] = useState('');
  const [pollType, setPollType] = useState<'general' | 'activity' | 'restaurant' | 'accommodation' | 'time'>('general');
  const [multipleChoice, setMultipleChoice] = useState(false);
  const [maxChoices, setMaxChoices] = useState(1);
  const [options, setOptions] = useState<PollOption[]>([
    { id: '1', label: '' },
    { id: '2', label: '' }
  ]);
  const [deadline, setDeadline] = useState('');
  const [autoExecute, setAutoExecute] = useState(false);
  const [consensusThreshold, setConsensusThreshold] = useState(50);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Add new option
  const handleAddOption = () => {
    const newId = (Math.max(...options.map(o => parseInt(o.id)), 0) + 1).toString();
    setOptions([...options, { id: newId, label: '' }]);
  };

  // Remove option
  const handleRemoveOption = (id: string) => {
    if (options.length <= 2) {
      setError('Poll must have at least 2 options');
      return;
    }
    setOptions(options.filter(o => o.id !== id));
  };

  // Update option label
  const handleOptionChange = (id: string, label: string) => {
    setOptions(options.map(o =>
      o.id === id ? { ...o, label } : o
    ));
  };

  // Validate form
  const validateForm = (): boolean => {
    setError('');

    if (!question.trim()) {
      setError('Question is required');
      return false;
    }

    const filledOptions = options.filter(o => o.label.trim());
    if (filledOptions.length < 2) {
      setError('At least 2 options are required');
      return false;
    }

    if (multipleChoice && maxChoices > filledOptions.length) {
      setError('Max choices cannot exceed number of options');
      return false;
    }

    return true;
  };

  // Submit poll
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      const filledOptions = options.filter(o => o.label.trim());

      const response = await fetch(`/api/routes/${routeId}/polls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('rdtrip_token')}`
        },
        body: JSON.stringify({
          question: question.trim(),
          description: description.trim() || undefined,
          pollType,
          targetType,
          targetId,
          dayNumber,
          options: filledOptions,
          multipleChoice,
          maxChoices: multipleChoice ? maxChoices : 1,
          deadline: deadline || undefined,
          autoExecute,
          consensusThreshold
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create poll');
      }

      const data = await response.json();

      if (onPollCreated) {
        onPollCreated(data.poll);
      }

      onClose();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-900">Create New Poll</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Body - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </motion.div>
            )}

            {/* Question */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Poll Question *
              </label>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g., Which restaurant should we visit for dinner?"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                maxLength={200}
              />
              <p className="text-xs text-gray-500 mt-1">{question.length}/200</p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add more context about this poll..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={3}
                maxLength={500}
              />
            </div>

            {/* Poll Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Poll Type
              </label>
              <select
                value={pollType}
                onChange={(e) => setPollType(e.target.value as any)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="general">General Decision</option>
                <option value="activity">Activity Selection</option>
                <option value="restaurant">Restaurant Choice</option>
                <option value="accommodation">Accommodation</option>
                <option value="time">Time/Schedule</option>
              </select>
            </div>

            {/* Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Options * (minimum 2)
              </label>
              <div className="space-y-3">
                {options.map((option, index) => (
                  <div key={option.id} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={option.label}
                      onChange={(e) => handleOptionChange(option.id, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {options.length > 2 && (
                      <button
                        onClick={() => handleRemoveOption(option.id)}
                        className="text-red-600 hover:text-red-700 p-2"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={handleAddOption}
                className="mt-3 flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Option
              </button>
            </div>

            {/* Multiple Choice */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="multipleChoice"
                checked={multipleChoice}
                onChange={(e) => setMultipleChoice(e.target.checked)}
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <label htmlFor="multipleChoice" className="block text-sm font-medium text-gray-700">
                  Allow multiple choices
                </label>
                {multipleChoice && (
                  <div className="mt-2">
                    <label className="block text-sm text-gray-600 mb-1">
                      Maximum choices
                    </label>
                    <input
                      type="number"
                      value={maxChoices}
                      onChange={(e) => setMaxChoices(parseInt(e.target.value) || 1)}
                      min={1}
                      max={options.length}
                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Deadline */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deadline (optional)
              </label>
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Advanced Options */}
            <details className="border border-gray-200 rounded-lg p-4">
              <summary className="font-medium text-gray-700 cursor-pointer">
                Advanced Options
              </summary>
              <div className="mt-4 space-y-4">
                {/* Auto Execute */}
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="autoExecute"
                    checked={autoExecute}
                    onChange={(e) => setAutoExecute(e.target.checked)}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <label htmlFor="autoExecute" className="block text-sm font-medium text-gray-700">
                      Auto-execute winning option
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Automatically apply the winning choice when consensus is reached
                    </p>
                  </div>
                </div>

                {/* Consensus Threshold */}
                {autoExecute && (
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Consensus threshold: {consensusThreshold}%
                    </label>
                    <input
                      type="range"
                      value={consensusThreshold}
                      onChange={(e) => setConsensusThreshold(parseInt(e.target.value))}
                      min={50}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>
                )}
              </div>
            </details>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
            <button
              onClick={onClose}
              className="px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg font-medium transition-colors"
            >
              {loading ? 'Creating...' : 'Create Poll'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
