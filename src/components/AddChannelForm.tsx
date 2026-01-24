'use client';

import { useState } from 'react';

interface AddChannelFormProps {
  onAdd: (input: string) => Promise<void>;
}

export default function AddChannelForm({ onAdd }: AddChannelFormProps) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    setError(null);

    try {
      await onAdd(input.trim());
      setInput('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'ajout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label htmlFor="channel-input" className="block text-sm font-medium text-gray-700 mb-1">
          Ajouter une chaîne
        </label>
        <div className="flex gap-2">
          <input
            id="channel-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="URL YouTube, @handle, ou ID de chaîne"
            className="flex-grow px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '...' : '+ Ajouter'}
          </button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <p className="text-xs text-gray-500">
        Exemples: https://youtube.com/@Fireship, @ThePrimeagen, UCsBjURrPoezykLs9EqgamOA
      </p>
    </form>
  );
}
