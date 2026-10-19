import React, { useState } from 'react';
import { X, BookOpen, Star, Send, Globe, Heart } from 'lucide-react';
import { exhibitionStore, useExhibitionStore } from '../../store/exhibitionStore';

export const GuestbookModal: React.FC = () => {
  const { guestbook } = useExhibitionStore();

  const [author, setAuthor] = useState('');
  const [country, setCountry] = useState('');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!author.trim() || !message.trim()) return;

    setIsSubmitting(true);
    exhibitionStore.addGuestbookEntry({
      author: author.trim(),
      country: country.trim() || 'Global Patron',
      message: message.trim(),
      rating,
      avatarColor: ['#f59e0b', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6'][Math.floor(Math.random() * 5)],
    });

    setAuthor('');
    setMessage('');
    setCountry('');
    setIsSubmitting(false);
    setHasSigned(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-4xl glass-panel rounded-3xl p-6 sm:p-8 flex flex-col max-h-[90vh] shadow-2xl border border-slate-700/80">
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-700/60">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen size={22} className="text-amber-400" />
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-white tracking-wide">
                Visitor Guestbook & Ledger
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Leave your signature, impressions, and sentiments for the exhibiting artists
            </p>
          </div>
          <button
            onClick={() => exhibitionStore.setActiveModal(null)}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body: Two Columns (Form + Signatures) */}
        <div className="my-5 grid grid-cols-1 md:grid-cols-12 gap-6 flex-1 overflow-hidden">
          {/* Sign the Guestbook Form (5 cols) */}
          <div className="md:col-span-5 bg-slate-950/60 rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
            <div>
              <h3 className="font-serif text-base font-semibold text-white mb-3 flex items-center gap-2">
                <Heart size={16} className="text-amber-400" /> Sign the Ledger
              </h3>

              {hasSigned ? (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center animate-fadeIn">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center mx-auto mb-2">
                    ✓
                  </div>
                  <h4 className="font-serif font-bold text-sm text-white">Signature Inscribed</h4>
                  <p className="text-xs text-slate-300 mt-1">
                    Thank you for honoring the photographers of Chayaksha 2026.
                  </p>
                  <button
                    onClick={() => setHasSigned(false)}
                    className="mt-3 text-xs text-amber-400 hover:underline"
                  >
                    Sign another entry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Your Name / Title
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Marcella Rossi"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Country / City
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Milan, Italy"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Salon Rating
                    </label>
                    <div className="flex items-center gap-1.5 py-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className={`p-1 rounded transition-transform ${
                            rating >= star ? 'text-amber-400 scale-110' : 'text-slate-600 hover:text-slate-400'
                          }`}
                        >
                          <Star size={18} fill={rating >= star ? 'currentColor' : 'none'} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Visitor Impression & Comments
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Share your thoughts on the curation, lighting, or specific artworks..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-amber-400 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                  >
                    <Send size={13} />
                    Inscribe Signature
                  </button>
                </form>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center gap-1">
              <Globe size={13} /> Synchronized live across all digital visitors
            </div>
          </div>

          {/* Signatures List (7 cols) */}
          <div className="md:col-span-7 flex flex-col overflow-hidden">
            <h3 className="font-serif text-base font-semibold text-white mb-3 flex items-center justify-between">
              <span>Signatures ({guestbook.length})</span>
              <span className="text-xs font-sans text-slate-400">Chronological Archive</span>
            </h3>

            <div className="flex-1 overflow-y-auto pr-2 space-y-3">
              {guestbook.map((entry) => (
                <div
                  key={entry.id}
                  className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-slate-950"
                        style={{ backgroundColor: entry.avatarColor || '#f59e0b' }}
                      >
                        {entry.author.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-100">{entry.author}</h4>
                        <span className="text-[10px] text-slate-400">{entry.country}</span>
                      </div>
                    </div>

                    {/* Star Rating */}
                    <div className="flex items-center gap-0.5 text-amber-400">
                      {Array.from({ length: entry.rating || 5 }).map((_, i) => (
                        <Star key={i} size={11} fill="currentColor" />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed italic pl-9">
                    "{entry.message}"
                  </p>

                  <div className="text-[10px] font-mono text-slate-500 text-right mt-2">
                    {new Date(entry.timestamp).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
