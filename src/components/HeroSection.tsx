import { useState } from 'react';
import { ArrowRight, Film } from 'lucide-react';
import type { Movie, Showtime } from '../types/cinema';
import { HERO_AUDITORIUM_IMAGE } from '../data/cinemaData';

interface HeroSectionProps {
  featuredMovie: Movie | null;
  onBookShowtime: (movie: Movie, showtime: Showtime) => void;
  onInspectMovie: (movie: Movie) => void;
}

export function HeroSection({
  featuredMovie,
  onBookShowtime,
  onInspectMovie,
}: HeroSectionProps) {
  const [heroImgFailed, setHeroImgFailed] = useState(false);

  const primaryShowtime = featuredMovie?.showtimes[1] ?? featuredMovie?.showtimes[0] ?? null;

  return (
    <section id="top" className="border-b border-white/10 bg-[#0B0C0E]">
      <div className="max-w-6xl mx-auto px-6 pt-10 pb-12">
        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#131519] min-h-[420px] lg:min-h-[480px] flex items-end">
          {!heroImgFailed ? (
            <img
              src={HERO_AUDITORIUM_IMAGE}
              alt="Большой зал кинотеатра Люмьер с тёплым архитектурным светом и бархатными креслами"
              referrerPolicy="no-referrer"
              onError={() => setHeroImgFailed(true)}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#1C1F26] via-[#131519] to-[#0B0C0E] flex items-center justify-center">
              <Film className="w-16 h-16 text-white/15" aria-hidden="true" />
            </div>
          )}

          {/* Measured contrast scrim */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-[#0B0C0E] via-[#0B0C0E]/75 to-[#0B0C0E]/20"
          />

          <div className="relative z-10 w-full p-7 sm:p-10 lg:p-12 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="max-w-2xl">
              <p className="text-xs font-medium tracking-wide text-[#E5A93C] mb-3">
                Главная премьера недели · Зал 1 Люмьер IMAX
              </p>

              <h1 className="font-display text-4xl sm:text-5xl font-semibold text-[#F4F4F5] leading-[1.1] tracking-tight text-balance">
                {featuredMovie ? featuredMovie.title : 'Кино в идеальной акустике и свете'}
              </h1>

              <p className="mt-4 text-base text-[#D4D4D8] leading-relaxed max-w-xl">
                {featuredMovie
                  ? featuredMovie.logline
                  : 'Три авторских зала с лазерной проекцией 4K, креслами увеличенного комфорта и мгновенным выбором мест без комиссии.'}
              </p>

              {featuredMovie && (
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[#A1A1AA] tabular-nums">
                  <span>{featuredMovie.genre}</span>
                  <span aria-hidden="true">·</span>
                  <span>{featuredMovie.durationMin} мин</span>
                  <span aria-hidden="true">·</span>
                  <span>{featuredMovie.ageRating}</span>
                  <span aria-hidden="true">·</span>
                  <span>Рейтинг {featuredMovie.rating}</span>
                </div>
              )}
            </div>

            {featuredMovie && primaryShowtime && (
              <div className="flex flex-wrap items-center gap-4 shrink-0">
                <button
                  type="button"
                  onClick={() => onBookShowtime(featuredMovie, primaryShowtime)}
                  className="inline-flex items-center gap-2.5 px-6 py-3 text-sm font-semibold text-[#0B0C0E] bg-[#E5A93C] hover:bg-[#EEB955] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5A93C]"
                >
                  <span className="tabular-nums">
                    Выбрать места · {primaryShowtime.time}
                  </span>
                  <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={() => onInspectMovie(featuredMovie)}
                  className="px-5 py-3 text-sm font-medium text-[#F4F4F5] bg-[#131519]/90 hover:bg-[#1C1F26] border border-white/15 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5A93C]"
                >
                  О фильме и все сеансы
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Full-width 4-column specification strip below hero */}
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4 border-t border-white/10 pt-6">
          <div>
            <p className="text-xs text-[#A1A1AA]">Проекция</p>
            <p className="mt-1 text-sm font-semibold text-[#F4F4F5] tabular-nums">
              Двойной лазер 4K
            </p>
          </div>
          <div>
            <p className="text-xs text-[#A1A1AA]">Акустика</p>
            <p className="mt-1 text-sm font-semibold text-[#F4F4F5] tabular-nums">
              Dolby Atmos · 64 канала
            </p>
          </div>
          <div>
            <p className="text-xs text-[#A1A1AA]">Онлайн-бронирование</p>
            <p className="mt-1 text-sm font-semibold text-[#F4F4F5] tabular-nums">
              0 ₽ сервисный сбор
            </p>
          </div>
          <div>
            <p className="text-xs text-[#A1A1AA]">Возврат и отмена</p>
            <p className="mt-1 text-sm font-semibold text-[#F4F4F5] tabular-nums">
              За 30 минут до начала
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
