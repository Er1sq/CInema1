import { Search, X } from 'lucide-react';
import type { ShowtimeDateKey, ShowtimeFormat } from '../types/cinema';

interface FilterBarProps {
  query: string;
  onQueryChange: (val: string) => void;
  selectedDate: 'all' | ShowtimeDateKey;
  onDateChange: (val: 'all' | ShowtimeDateKey) => void;
  selectedGenre: string;
  onGenreChange: (val: string) => void;
  selectedFormat: 'all' | ShowtimeFormat;
  onFormatChange: (val: 'all' | ShowtimeFormat) => void;
  genres: string[];
  totalCount: number;
  onReset: () => void;
}

const DATE_OPTIONS: Array<{ value: 'all' | ShowtimeDateKey; label: string }> = [
  { value: 'all', label: 'Все дни' },
  { value: 'today', label: 'Сегодня' },
  { value: 'tomorrow', label: 'Завтра' },
  { value: 'weekend', label: 'Выходные' },
];

const FORMAT_OPTIONS: Array<{ value: 'all' | ShowtimeFormat; label: string }> = [
  { value: 'all', label: 'Все форматы' },
  { value: 'IMAX', label: 'IMAX' },
  { value: 'Dolby Atmos', label: 'Dolby Atmos' },
  { value: '2D', label: '2D' },
  { value: 'Оригинал с субтитрами', label: 'Субтитры' },
];

export function FilterBar({
  query,
  onQueryChange,
  selectedDate,
  onDateChange,
  selectedGenre,
  onGenreChange,
  selectedFormat,
  onFormatChange,
  genres,
  totalCount,
  onReset,
}: FilterBarProps) {
  const hasActiveFilters =
    query.trim() !== '' ||
    selectedDate !== 'all' ||
    selectedGenre !== 'all' ||
    selectedFormat !== 'all';

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Date segmented control */}
        <div
          role="group"
          aria-label="Выбор дня показа"
          className="inline-flex flex-wrap items-center gap-1 p-1 bg-[#131519] border border-white/10 rounded-lg self-start"
        >
          {DATE_OPTIONS.map((opt) => {
            const active = selectedDate === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onDateChange(opt.value)}
                aria-pressed={active}
                className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5A93C] ${
                  active
                    ? 'bg-[#E5A93C] text-[#0B0C0E] font-semibold'
                    : 'text-[#A1A1AA] hover:text-[#F4F4F5]'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Search input */}
        <div className="relative w-full lg:w-80">
          <label htmlFor="movie-search" className="sr-only">
            Поиск фильма или режиссёра
          </label>
          <Search
            className="w-4 h-4 text-[#71717A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            id="movie-search"
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Название фильма или режиссёр..."
            className="w-full pl-10 pr-9 py-2.5 text-sm bg-[#131519] text-[#F4F4F5] placeholder:text-[#71717A] border border-white/10 rounded-lg focus:outline-none focus:border-[#E5A93C] focus-visible:ring-1 focus-visible:ring-[#E5A93C]"
          />
          {query && (
            <button
              type="button"
              onClick={() => onQueryChange('')}
              aria-label="Очистить поиск"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#71717A] hover:text-[#F4F4F5] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Genre & Format controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Фильтр по жанру">
          <button
            type="button"
            onClick={() => onGenreChange('all')}
            aria-pressed={selectedGenre === 'all'}
            className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              selectedGenre === 'all'
                ? 'bg-[#1C1F26] text-[#F4F4F5] border-white/25'
                : 'bg-transparent text-[#A1A1AA] border-white/10 hover:text-[#F4F4F5] hover:border-white/20'
            }`}
          >
            Все жанры
          </button>
          {genres.map((genre) => {
            const active = selectedGenre === genre;
            return (
              <button
                key={genre}
                type="button"
                onClick={() => onGenreChange(genre)}
                aria-pressed={active}
                className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-[#1C1F26] text-[#F4F4F5] border-white/25'
                    : 'bg-transparent text-[#A1A1AA] border-white/10 hover:text-[#F4F4F5] hover:border-white/20'
                }`}
              >
                {genre}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="format-filter" className="text-xs text-[#71717A] whitespace-nowrap">
              Формат:
            </label>
            <select
              id="format-filter"
              value={selectedFormat}
              onChange={(e) => onFormatChange(e.target.value as 'all' | ShowtimeFormat)}
              className="px-3 py-1.5 text-xs font-medium bg-[#131519] text-[#F4F4F5] border border-white/10 rounded-md focus:outline-none focus:border-[#E5A93C] cursor-pointer"
            >
              {FORMAT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <span className="text-xs text-[#71717A] tabular-nums whitespace-nowrap">
            Найдено: {totalCount}
          </span>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onReset}
              className="text-xs font-medium text-[#E5A93C] hover:underline whitespace-nowrap cursor-pointer"
            >
              Сбросить
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
