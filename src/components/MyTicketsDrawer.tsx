import { useEffect, useState } from 'react';
import { CheckCircle2, Search, Ticket, X, XCircle } from 'lucide-react';
import type { BookingRecord } from '../types/cinema';
import { formatCurrency, formatSeatShort } from '../utils/bookingLogic';
import { QrMatrix } from './QrMatrix';

interface MyTicketsDrawerProps {
  open: boolean;
  bookings: BookingRecord[];
  onClose: () => void;
  onCancelBooking: (bookingId: string) => Promise<void>;
}

export function MyTicketsDrawer({
  open,
  bookings,
  onClose,
  onCancelBooking,
}: MyTicketsDrawerProps) {
  const [searchCode, setSearchCode] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed'>('all');
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const filtered = bookings.filter((b) => {
    if (statusFilter === 'confirmed' && b.status !== 'confirmed') return false;
    if (searchCode.trim()) {
      const q = searchCode.trim().toLowerCase();
      const matchCode = b.bookingCode.toLowerCase().includes(q);
      const matchMovie = b.movieTitle.toLowerCase().includes(q);
      const matchName = b.customerName.toLowerCase().includes(q);
      if (!matchCode && !matchMovie && !matchName) return false;
    }
    return true;
  });

  const handleConfirmCancel = async (id: string) => {
    setCancellingId(id);
    try {
      await onCancelBooking(id);
      setConfirmCancelId(null);
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="my-tickets-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg h-full bg-[#131519] border-l border-white/15 flex flex-col shadow-2xl">
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between gap-4">
          <div>
            <h2 id="my-tickets-title" className="font-display text-2xl font-semibold text-[#F4F4F5]">
              Мои билеты
            </h2>
            <p className="text-xs text-[#71717A] mt-0.5 tabular-nums">
              Всего заказов: {bookings.length}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть панель билетов"
            className="p-2 rounded-lg text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#1C1F26] border border-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search and filter controls */}
        <div className="px-6 py-4 border-b border-white/10 space-y-3 bg-[#0F1114]">
          <div className="relative">
            <label htmlFor="tickets-search" className="sr-only">
              Поиск по коду брони или фильму
            </label>
            <Search
              className="w-4 h-4 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="tickets-search"
              type="search"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              placeholder="Код брони (LM-...) или фильм..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-[#131519] text-[#F4F4F5] placeholder:text-[#71717A] border border-white/10 rounded-lg focus:outline-none focus:border-[#E5A93C]"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              aria-pressed={statusFilter === 'all'}
              className={`px-3 py-1.5 text-xs font-medium rounded-md border cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-[#1C1F26] text-[#F4F4F5] border-white/25'
                  : 'text-[#A1A1AA] border-white/10 hover:text-[#F4F4F5]'
              }`}
            >
              Все заказы
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('confirmed')}
              aria-pressed={statusFilter === 'confirmed'}
              className={`px-3 py-1.5 text-xs font-medium rounded-md border cursor-pointer ${
                statusFilter === 'confirmed'
                  ? 'bg-[#1C1F26] text-[#F4F4F5] border-white/25'
                  : 'text-[#A1A1AA] border-white/10 hover:text-[#F4F4F5]'
              }`}
            >
              Только активные
            </button>
          </div>
        </div>

        {/* Bookings List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <Ticket className="w-10 h-10 text-white/15 mx-auto mb-3" aria-hidden="true" />
              <p className="text-base font-medium text-[#F4F4F5]">Билеты не найдены</p>
              <p className="mt-1.5 text-xs text-[#71717A]">
                {bookings.length === 0
                  ? 'Выберите сеанс на афише, чтобы оформить первый электронный билет.'
                  : 'Попробуйте очистить фильтр или строку поиска.'}
              </p>
            </div>
          ) : (
            filtered.map((booking) => {
              const isConfirmed = booking.status === 'confirmed';
              return (
                <article
                  key={booking.id}
                  data-testid={`ticket-card-${booking.bookingCode}`}
                  className="p-5 rounded-xl bg-[#0F1114] border border-white/10 space-y-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-mono font-semibold text-[#E5A93C] tabular-nums">
                          {booking.bookingCode}
                        </span>
                        <span aria-hidden="true" className="text-[#52525B]">
                          ·
                        </span>
                        {isConfirmed ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Подтверждена</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[#71717A] font-medium">
                            <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Отменена</span>
                          </span>
                        )}
                      </div>

                      <h3 className="mt-1.5 font-display text-xl font-semibold text-[#F4F4F5]">
                        {booking.movieTitle}
                      </h3>
                      <p className="mt-1 text-xs text-[#A1A1AA] tabular-nums">
                        {booking.dateLabel}, {booking.time} · {booking.hallName}
                      </p>
                    </div>

                    {isConfirmed && <QrMatrix code={booking.bookingCode} size={68} />}
                  </div>

                  <div className="pt-3 border-t border-white/10 text-xs space-y-1.5">
                    <p className="text-[#E4E4E7] tabular-nums">
                      <span className="text-[#71717A]">Места: </span>
                      {booking.seats.map((s) => formatSeatShort(s.row, s.number)).join('; ')}
                    </p>
                    {booking.snacks.length > 0 && (
                      <p className="text-[#D4D4D8]">
                        <span className="text-[#71717A]">Кинобар: </span>
                        {booking.snacks.map((s) => `${s.name} × ${s.quantity}`).join(', ')}
                      </p>
                    )}
                    <p className="text-[#A1A1AA]">
                      <span className="text-[#71717A]">Гость: </span>
                      {booking.customerName} · {booking.customerEmail}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
                    <span className="font-mono text-base font-semibold text-[#F4F4F5] tabular-nums">
                      {formatCurrency(booking.totals.grandTotal)}
                    </span>

                    {isConfirmed && (
                      <div>
                        {confirmCancelId === booking.id ? (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={cancellingId === booking.id}
                              onClick={() => handleConfirmCancel(booking.id)}
                              className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-md cursor-pointer"
                            >
                              {cancellingId === booking.id ? 'Отмена...' : 'Да, отменить'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmCancelId(null)}
                              className="px-2.5 py-1.5 text-xs text-[#A1A1AA] hover:text-[#F4F4F5] cursor-pointer"
                            >
                              Нет
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmCancelId(booking.id)}
                            className="px-3 py-1.5 text-xs font-medium text-[#A1A1AA] hover:text-red-300 border border-white/10 hover:border-red-500/40 rounded-md transition-colors cursor-pointer"
                          >
                            Отменить бронь
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
