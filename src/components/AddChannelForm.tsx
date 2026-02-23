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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col gap-4">
        <label htmlFor="channel-input" className="text-[10px] font-black uppercase tracking-[0.2em] text-primary italic">
          Entrée Source
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            id="channel-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="URL YouTube, @handle, ou ID..."
            className="flex-grow px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all placeholder:text-muted-foreground/30"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-8 py-3.5 bg-primary text-primary-foreground font-black rounded-2xl hover:opacity-90 disabled:opacity-50 transition-all shadow-xl shadow-primary/20 active:scale-95 text-xs uppercase tracking-widest whitespace-nowrap"
          >
            {loading ? 'CHARGEMENT...' : 'AJOUTER'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-widest animate-in slide-in-from-left-2 duration-300">
          ⚠️ {error}
        </div>
      )}

      <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
        <p className="text-[10px] font-medium text-muted-foreground/60 leading-relaxed">
          <span className="text-primary/60 font-black">EXEMPLES :</span> @Fireship, @ThePrimeagen, youtube.com/@JoueurDuGrenier
        </p>
      </div>
    </form>
  );
}
