import { useEffect, useState } from 'react';
import { Film, X } from 'lucide-react';
import type { Movie, Showtime } from '../types/cinema';
import { formatCurrency, getHallDimensions } from '../utils/bookingLogic';

interface MovieDetailModalProps {
  movie: Movie | null;
  onClose: () => void;
  onSelectShowtime: (movie: Movie, showtime: Showtime) => void;
}

export function MovieDetailModal({
  movie,
  onClose,
  onSelectShowtime,
}: MovieDetailModalProps) {
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [movie?.id]);

  useEffect(() => {
    if (!movie) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [movie, onClose]);

  if (!movie) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="movie-detail-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[#131519] border border-white/15 rounded-xl shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрыть карточку фильма"
          className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-[#0B0C0E]/80 text-[#A1A1AA] hover:text-[#F4F4F5] border border-white/10 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5A93C]"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6 p-6 sm:p-8">
          <div className="aspect-[3/4] rounded-lg overflow-hidden bg-[#1C1F26] border border-white/10">
            {!imgFailed ? (
              <img
                src={movie.posterUrl}
                alt={`Постер фильма ${movie.title}`}
                referrerPolicy="no-referrer"
                onError={() => setImgFailed(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Film className="w-10 h-10 text-white/20" aria-hidden="true" />
              </div>
            )}
          </div>

          <div className="flex flex-col justify-between gap-6">
            <div>
              <p className="text-xs text-[#E5A93C] font-medium tabular-nums">
                {movie.genre} · {movie.year} · {movie.country} · {movie.durationMin} мин · {movie.ageRating}
              </p>

              <h2
                id="movie-detail-title"
                className="mt-2 font-display text-3xl font-semibold text-[#F4F4F5]"
              >
                {movie.title}
              </h2>
              <p className="text-xs text-[#71717A] mt-0.5">{movie.originalTitle}</p>

              <p className="mt-4 text-sm text-[#D4D4D8] leading-relaxed">{movie.synopsis}</p>

              <dl className="mt-5 space-y-2 text-xs border-t border-white/10 pt-4">
                <div className="flex gap-3">
                  <dt className="text-[#71717A] w-24 shrink-0">Режиссёр</dt>
                  <dd className="text-[#F4F4F5]">{movie.director}</dd>
                </div>
                <div className="flex gap-3">
                  <dt className="text-[#71717A] w-24 shrink-0">В ролях</dt>
                  <dd className="text-[#D4D4D8]">{movie.cast.join(', ')}</dd>
                </div>
                <div className="flex gap-3">
                  <dt className="text-[#71717A] w-24 shrink-0">Рейтинг</dt>
                  <dd className="text-[#F4F4F5] font-mono tabular-nums">{movie.rating} / 10</dd>
                </div>
              </dl>
            </div>

            <div className="border-t border-white/10 pt-4">
              <p className="text-xs font-medium text-[#A1A1AA] mb-3">Выберите сеанс для бронирования</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {movie.showtimes.map((st) => {
                  const dims = getHallDimensions(st.hallType);
                  const freeSeats = Math.max(
                    0,
                    dims.rows * dims.seatsPerRow - st.occupiedSeats.length,
                  );

                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => onSelectShowtime(movie, st)}
                      className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg bg-[#1C1F26] hover:bg-[#E5A93C] text-[#F4F4F5] hover:text-[#0B0C0E] border border-white/10 hover:border-[#E5A93C] transition-colors cursor-pointer text-left"
                    >
                      <div>
                        <span className="font-mono text-sm font-semibold tabular-nums">
                          {st.dateLabel}, {st.time}
                        </span>
                        <p className="text-[11px] opacity-80">
                          {st.hallName} · {freeSeats} мест
                        </p>
                      </div>
                      <span className="font-mono text-xs font-semibold tabular-nums shrink-0">
                        от {formatCurrency(st.basePrice)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
