/**
 * WebSearchCard - Web Search Results Display
 *
 * Clean, modern display for Perplexity API search results
 * Shows answer with source citations
 */

import { Globe, ExternalLink } from 'lucide-react';

interface WebSearchData {
  success: boolean;
  query: string;
  answer: string;
  citations?: string[];
  sources?: number;
  model?: string;
  error?: string;
}

interface WebSearchCardProps {
  data: WebSearchData;
}

export function WebSearchCard({ data }: WebSearchCardProps) {
  if (!data.success) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 max-w-2xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <Globe className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Search Failed</h3>
            <p className="text-sm text-red-600">{data.error || 'Unknown error'}</p>
          </div>
        </div>
      </div>
    );
  }

  const { query, answer, citations = [] } = data;

  return (
    <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 max-w-2xl hover:border-purple-200 transition-colors">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center">
          <Globe className="w-6 h-6 text-purple-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900">Web Search</h3>
          <p className="text-sm text-gray-600">{query}</p>
        </div>
      </div>

      {/* Answer */}
      <div className="mb-4 pb-4 border-b border-gray-200">
        <div className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">
          {answer}
        </div>
      </div>

      {/* Citations */}
      {citations.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
            Sources ({citations.length})
          </h4>
          <div className="space-y-1.5">
            {citations.slice(0, 5).map((citation, index) => {
              // Try to extract domain from URL
              let domain = 'Source';

              try {
                const url = new URL(citation);
                domain = url.hostname.replace('www.', '');
              } catch {
                // If not a valid URL, use as-is
              }

              return (
                <a
                  key={index}
                  href={citation}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50 px-3 py-2 rounded-lg transition-colors group"
                >
                  <span className="font-medium">{index + 1}.</span>
                  <span className="flex-1 truncate">{domain}</span>
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              );
            })}
            {citations.length > 5 && (
              <p className="text-xs text-gray-500 px-3 py-1">
                ... and {citations.length - 5} more source{citations.length - 5 !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Powered by Perplexity AI • Real-time web search
        </p>
      </div>
    </div>
  );
}
