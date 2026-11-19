import { useState } from 'react';
import { Film } from 'lucide-react';
import type { Movie, Showtime, ShowtimeDateKey, ShowtimeFormat } from '../types/cinema';
import { formatCurrency, getHallDimensions } from '../utils/bookingLogic';

interface MovieGridProps {
  movies: Movie[];
  selectedDate: 'all' | ShowtimeDateKey;
  selectedFormat: 'all' | ShowtimeFormat;
  onSelectShowtime: (movie: Movie, showtime: Showtime) => void;
  onInspectMovie: (movie: Movie) => void;
  onResetFilters: () => void;
}

function PosterImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-[#1C1F26] to-[#131519] flex flex-col items-center justify-center p-6 text-center">
        <Film className="w-10 h-10 text-white/20 mb-2" aria-hidden="true" />
        <span className="text-xs text-[#71717A]">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
    />
  );
}

export function MovieGrid({
  movies,
  selectedDate,
  selectedFormat,
  onSelectShowtime,
  onInspectMovie,
  onResetFilters,
}: MovieGridProps) {
  if (movies.length === 0) {
    return (
      <div className="py-16 px-6 text-center bg-[#131519] border border-white/10 rounded-xl">
        <p className="font-display text-2xl text-[#F4F4F5]">Сеансы по выбранным параметрам не найдены</p>
        <p className="mt-2 text-sm text-[#A1A1AA]">
          Попробуйте изменить день недели, формат зала или очистить строку поиска.
        </p>
        <button
          type="button"
          onClick={onResetFilters}
          className="mt-6 px-5 py-2.5 text-sm font-semibold text-[#0B0C0E] bg-[#E5A93C] hover:bg-[#EEB955] rounded-lg transition-colors cursor-pointer"
        >
          Сбросить фильтры
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {movies.map((movie) => {
        const visibleShowtimes = movie.showtimes.filter((st) => {
          if (selectedDate !== 'all' && st.dateKey !== selectedDate) return false;
          if (selectedFormat !== 'all' && st.format !== selectedFormat) return false;
          return true;
        });

        return (
          <article
            key={movie.id}
            data-testid={`movie-card-${movie.id}`}
            className="group flex flex-col bg-[#131519] border border-white/10 rounded-xl overflow-hidden transition-transform duration-200 hover:-translate-y-0.5 hover:border-white/20"
          >
            <button
              type="button"
              onClick={() => onInspectMovie(movie)}
              aria-label={`Подробнее о фильме ${movie.title}`}
              className="relative aspect-[3/4] w-full overflow-hidden bg-[#181A20] text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5A93C]"
            >
              <PosterImage src={movie.posterUrl} alt={`Постер фильма ${movie.title}`} />
              <div
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#131519] to-transparent"
              />
            </button>

            <div className="p-6 flex-1 flex flex-col justify-between gap-5">
              <div>
                {/* Zero-pill unboxed metadata */}
                <p className="text-xs text-[#A1A1AA] tabular-nums">
                  {movie.genre} · {movie.durationMin} мин · {movie.ageRating} · Рейтинг {movie.rating}
                </p>

                <h3 className="mt-2 font-display text-xl font-semibold text-[#F4F4F5] leading-snug">
                  <button
                    type="button"
                    onClick={() => onInspectMovie(movie)}
                    className="text-left hover:text-[#E5A93C] transition-colors cursor-pointer focus-visible:outline-none focus-visible:underline"
                  >
                    {movie.title}
                  </button>
                </h3>

                <p className="mt-1 text-xs text-[#71717A]">Режиссёр: {movie.director}</p>
                <p className="mt-3 text-sm text-[#D4D4D8] leading-relaxed">
                  {movie.logline}
                </p>
              </div>

              <div className="pt-4 border-t border-white/10">
                <p className="text-xs font-medium text-[#A1A1AA] mb-2.5">
                  Ближайшие сеансы
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {visibleShowtimes.map((st) => {
                    const dims = getHallDimensions(st.hallType);
                    const totalSeats = dims.rows * dims.seatsPerRow;
                    const freeSeats = Math.max(0, totalSeats - st.occupiedSeats.length);
                    const shortFormat =
                      st.format === 'Оригинал с субтитрами' ? 'Субтитры' : st.format;

                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => onSelectShowtime(movie, st)}
                        aria-label={`Выбрать места на ${movie.title}, ${st.dateLabel} в ${st.time}, ${st.format}, ${freeSeats} мест, от ${st.basePrice} рублей`}
                        className="flex flex-col items-start px-3 py-2 rounded-lg bg-[#1C1F26] hover:bg-[#E5A93C] text-[#F4F4F5] hover:text-[#0B0C0E] border border-white/10 hover:border-[#E5A93C] transition-colors text-left cursor-pointer group/btn focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5A93C]"
                      >
                        <div className="w-full flex items-baseline justify-between gap-2">
                          <span className="font-mono text-sm font-semibold tabular-nums">
                            {st.time}
                          </span>
                          <span className="text-xs opacity-80 tabular-nums">
                            {formatCurrency(st.basePrice)}
                          </span>
                        </div>
                        <span className="mt-0.5 text-[11px] opacity-75 w-full whitespace-nowrap">
                          {st.dateLabel} · {shortFormat}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
