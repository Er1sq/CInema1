import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  BookingRecord,
  HallInfo,
  Movie,
  Showtime,
  ShowtimeDateKey,
  ShowtimeFormat,
  SnackItem,
  UpcomingMovie,
} from './types/cinema';
import { getSeedMovies, HALLS, SNACKS, UPCOMING_MOVIES } from './data/cinemaData';
import { filterMovies } from './utils/bookingLogic';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { FilterBar } from './components/FilterBar';
import { MovieGrid } from './components/MovieGrid';
import { HallsAndBarSection } from './components/HallsAndBarSection';
import { MovieDetailModal } from './components/MovieDetailModal';
import { BookingModal } from './components/BookingModal';
import { MyTicketsDrawer } from './components/MyTicketsDrawer';

export default function App() {
  const [movies, setMovies] = useState<Movie[]>(() => getSeedMovies());
  const [halls, setHalls] = useState<HallInfo[]>(HALLS);
  const [snacks, setSnacks] = useState<SnackItem[]>(SNACKS);
  const [upcoming, setUpcoming] = useState<UpcomingMovie[]>(UPCOMING_MOVIES);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Filters
  const [query, setQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<'all' | ShowtimeDateKey>('all');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [selectedFormat, setSelectedFormat] = useState<'all' | ShowtimeFormat>('all');

  // Modals & Drawers
  const [inspectedMovie, setInspectedMovie] = useState<Movie | null>(null);
  const [bookingContext, setBookingContext] = useState<{
    movie: Movie;
    showtime: Showtime;
  } | null>(null);
  const [ticketsDrawerOpen, setTicketsDrawerOpen] = useState(false);

  // Upcoming reminders stored locally
  const [remindedIds, setRemindedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('lumiere_reminders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const fetchCinemaAndBookings = useCallback(async () => {
    try {
      const [cinemaRes, bookingsRes] = await Promise.all([
        fetch('/api/cinema'),
        fetch('/api/bookings'),
      ]);
      if (cinemaRes.ok) {
        const cinemaData = await cinemaRes.json();
        if (Array.isArray(cinemaData.movies)) setMovies(cinemaData.movies);
        if (Array.isArray(cinemaData.halls)) setHalls(cinemaData.halls);
        if (Array.isArray(cinemaData.snacks)) setSnacks(cinemaData.snacks);
        if (Array.isArray(cinemaData.upcoming)) setUpcoming(cinemaData.upcoming);
      }
      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json();
        if (Array.isArray(bookingsData.bookings)) setBookings(bookingsData.bookings);
      }
      setLoadError(null);
    } catch {
      setLoadError('Не удалось обновить расписание с сервера. Показана базовая программа.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCinemaAndBookings();
  }, [fetchCinemaAndBookings]);

  const genres = useMemo(() => {
    return Array.from(new Set(movies.map((m) => m.genre)));
  }, [movies]);

  const filteredMovies = useMemo(() => {
    return filterMovies(movies, {
      query,
      genre: selectedGenre,
      format: selectedFormat,
      date: selectedDate,
    });
  }, [movies, query, selectedGenre, selectedFormat, selectedDate]);

  const featuredMovie = useMemo(() => {
    return movies.find((m) => m.isFeatured) ?? movies[0] ?? null;
  }, [movies]);

  const activeTicketsCount = useMemo(() => {
    return bookings.filter((b) => b.status === 'confirmed').length;
  }, [bookings]);

  const handleResetFilters = () => {
    setQuery('');
    setSelectedDate('all');
    setSelectedGenre('all');
    setSelectedFormat('all');
  };

  const handleStartBooking = (movie: Movie, showtime: Showtime) => {
    setInspectedMovie(null);
    setBookingContext({ movie, showtime });
  };

  const handleBookingCreated = (newBooking: BookingRecord) => {
    setBookings((prev) => [newBooking, ...prev]);
    fetchCinemaAndBookings();
  };

  const handleCancelBooking = async (bookingId: string) => {
    const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
      method: 'PATCH',
    });
    if (res.ok) {
      const data = await res.json();
      setBookings((prev) =>
        prev.map((item) => (item.id === bookingId ? data.booking : item)),
      );
      fetchCinemaAndBookings();
    }
  };

  const handleToggleRemind = (id: string) => {
    setRemindedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        localStorage.setItem('lumiere_reminders', JSON.stringify(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0C0E] text-[#F4F4F5]">
      <Header
        activeTicketsCount={activeTicketsCount}
        onOpenTickets={() => setTicketsDrawerOpen(true)}
      />

      <main className="flex-1">
        <HeroSection
          featuredMovie={featuredMovie}
          onBookShowtime={handleStartBooking}
          onInspectMovie={(m) => setInspectedMovie(m)}
        />

        {/* Афиша и выбор сеанса */}
        <section id="afisha" className="py-14">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <p className="text-xs font-medium text-[#E5A93C] mb-2">
                  Репертуар кинотеатра
                </p>
                <h2 className="font-display text-3xl font-semibold text-[#F4F4F5]">
                  Афиша и расписание сеансов
                </h2>
              </div>
              <p className="text-sm text-[#A1A1AA]">
                Выберите удобное время сеанса, чтобы открыть схему зала и забронировать места.
              </p>
            </div>

            {loadError && (
              <div
                role="status"
                className="mb-6 p-3.5 text-xs text-amber-200 bg-amber-950/40 border border-amber-500/30 rounded-lg"
              >
                {loadError}
              </div>
            )}

            <div className="mb-8">
              <FilterBar
                query={query}
                onQueryChange={setQuery}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                selectedGenre={selectedGenre}
                onGenreChange={setSelectedGenre}
                selectedFormat={selectedFormat}
                onFormatChange={setSelectedFormat}
                genres={genres}
                totalCount={filteredMovies.length}
                onReset={handleResetFilters}
              />
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className="h-[520px] rounded-xl bg-[#131519] border border-white/10 animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <MovieGrid
                movies={filteredMovies}
                selectedDate={selectedDate}
                selectedFormat={selectedFormat}
                onSelectShowtime={handleStartBooking}
                onInspectMovie={(m) => setInspectedMovie(m)}
                onResetFilters={handleResetFilters}
              />
            )}
          </div>
        </section>

        <HallsAndBarSection
          halls={halls}
          snacks={snacks}
          upcoming={upcoming}
          remindedIds={remindedIds}
          onToggleRemind={handleToggleRemind}
        />
      </main>

      <footer className="border-t border-white/10 bg-[#08090B] py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="font-display text-xl font-semibold text-[#F4F4F5]">Люмьер</p>
            <p className="mt-1 text-xs text-[#71717A]">
              ул. Кинематографистов, 14 · Ежедневно с 10:00 до 01:30 · Промокод на первую покупку: LUMIERE10
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-[#A1A1AA]">
            <a href="#afisha" className="hover:text-[#F4F4F5] transition-colors">
              Афиша
            </a>
            <a href="#halls" className="hover:text-[#F4F4F5] transition-colors">
              Залы
            </a>
            <a href="#bar" className="hover:text-[#F4F4F5] transition-colors">
              Кинобар
            </a>
            <button
              type="button"
              onClick={() => setTicketsDrawerOpen(true)}
              className="hover:text-[#F4F4F5] transition-colors cursor-pointer"
            >
              Мои билеты
            </button>
          </div>
        </div>
      </footer>

      <MovieDetailModal
        movie={inspectedMovie}
        onClose={() => setInspectedMovie(null)}
        onSelectShowtime={handleStartBooking}
      />

      <BookingModal
        movie={bookingContext?.movie ?? null}
        showtime={bookingContext?.showtime ?? null}
        snacksCatalog={snacks}
        onClose={() => setBookingContext(null)}
        onBookingCreated={handleBookingCreated}
        onOpenMyTickets={() => setTicketsDrawerOpen(true)}
      />

      <MyTicketsDrawer
        open={ticketsDrawerOpen}
        bookings={bookings}
        onClose={() => setTicketsDrawerOpen(false)}
        onCancelBooking={handleCancelBooking}
      />
    </div>
  );
}
