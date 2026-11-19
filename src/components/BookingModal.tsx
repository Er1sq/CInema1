import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, Minus, Plus, Ticket, X } from 'lucide-react';
import type {
  BookingFormErrors,
  BookingRecord,
  Movie,
  PaymentMethod,
  Seat,
  SelectedSeatDetail,
  SelectedSnack,
  Showtime,
  SnackItem,
} from '../types/cinema';
import {
  calculateOrderTotals,
  calculateSeatPrice,
  evaluatePromoCode,
  formatCurrency,
  formatSeatShort,
  generateSeatMap,
  getHallDimensions,
  getSeatTierLabel,
  validateBookingForm,
} from '../utils/bookingLogic';
import { QrMatrix } from './QrMatrix';

interface BookingModalProps {
  movie: Movie | null;
  showtime: Showtime | null;
  snacksCatalog: SnackItem[];
  onClose: () => void;
  onBookingCreated: (booking: BookingRecord) => void;
  onOpenMyTickets: () => void;
}

type BookingStep = 'seats' | 'checkout' | 'confirmed';

export function BookingModal({
  movie,
  showtime,
  snacksCatalog,
  onClose,
  onBookingCreated,
  onOpenMyTickets,
}: BookingModalProps) {
  const [step, setStep] = useState<BookingStep>('seats');
  const [occupiedSeats, setOccupiedSeats] = useState<string[]>([]);
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [snackQuantities, setSnackQuantities] = useState<Record<string, number>>({});

  // Checkout state
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState('');
  const [promoFeedback, setPromoFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(
    null,
  );
  const [formErrors, setFormErrors] = useState<BookingFormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<BookingRecord | null>(null);

  useEffect(() => {
    if (!showtime) return;
    setStep('seats');
    setSelectedSeatIds([]);
    setSnackQuantities({});
    setPromoInput('');
    setAppliedPromo('');
    setPromoFeedback(null);
    setFormErrors({});
    setSubmitError(null);
    setConfirmedBooking(null);
    setOccupiedSeats(showtime.occupiedSeats);

    let cancelled = false;
    setLoadingSeats(true);
    fetch(`/api/showtimes/${showtime.id}/seats`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data && Array.isArray(data.occupiedSeats)) {
          setOccupiedSeats(data.occupiedSeats);
        }
      })
      .catch(() => {
        // Fallback to cached occupiedSeats already set above
      })
      .finally(() => {
        if (!cancelled) setLoadingSeats(false);
      });

    return () => {
      cancelled = true;
    };
  }, [showtime]);

  useEffect(() => {
    if (!showtime) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showtime, onClose]);

  const seatMap: Seat[] = useMemo(() => {
    if (!showtime) return [];
    return generateSeatMap(showtime.hallType, occupiedSeats);
  }, [showtime, occupiedSeats]);

  const dimensions = useMemo(() => {
    if (!showtime) return { rows: 0, seatsPerRow: 0 };
    return getHallDimensions(showtime.hallType);
  }, [showtime]);

  const rowsGrouped = useMemo(() => {
    const groups: Seat[][] = [];
    for (let r = 1; r <= dimensions.rows; r++) {
      groups.push(seatMap.filter((s) => s.row === r));
    }
    return groups;
  }, [seatMap, dimensions.rows]);

  const selectedSeatDetails: SelectedSeatDetail[] = useMemo(() => {
    if (!showtime) return [];
    return selectedSeatIds
      .map((id) => seatMap.find((s) => s.id === id))
      .filter((s): s is Seat => Boolean(s))
      .sort((a, b) => (a.row !== b.row ? a.row - b.row : a.number - b.number))
      .map((s) => ({
        id: s.id,
        row: s.row,
        number: s.number,
        tier: s.tier,
        price: calculateSeatPrice(showtime.basePrice, s.tier),
      }));
  }, [selectedSeatIds, seatMap, showtime]);

  const selectedSnacks: SelectedSnack[] = useMemo(() => {
    return snacksCatalog
      .filter((s) => (snackQuantities[s.id] ?? 0) > 0)
      .map((s) => ({
        snackId: s.id,
        name: s.name,
        unitPrice: s.price,
        quantity: snackQuantities[s.id] ?? 0,
      }));
  }, [snacksCatalog, snackQuantities]);

  const totals = useMemo(() => {
    return calculateOrderTotals(selectedSeatDetails, selectedSnacks, appliedPromo);
  }, [selectedSeatDetails, selectedSnacks, appliedPromo]);

  if (!movie || !showtime) return null;

  const toggleSeat = (seat: Seat) => {
    if (seat.occupied) return;
    setSubmitError(null);
    setSelectedSeatIds((prev) => {
      if (prev.includes(seat.id)) {
        return prev.filter((id) => id !== seat.id);
      }
      if (prev.length >= 8) {
        setSubmitError('В одном заказе можно выбрать не более 8 мест');
        return prev;
      }
      return [...prev, seat.id];
    });
  };

  const adjustSnack = (snackId: string, delta: number) => {
    setSnackQuantities((prev) => {
      const next = Math.max(0, Math.min(10, (prev[snackId] ?? 0) + delta));
      return { ...prev, [snackId]: next };
    });
  };

  const handleApplyPromo = () => {
    const trimmed = promoInput.trim();
    if (!trimmed) {
      setAppliedPromo('');
      setPromoFeedback(null);
      return;
    }
    const res = evaluatePromoCode(trimmed);
    if (res.valid && res.label) {
      setAppliedPromo(trimmed.toUpperCase());
      setPromoFeedback({ type: 'ok', text: res.label });
    } else {
      setAppliedPromo('');
      setPromoFeedback({
        type: 'err',
        text: 'Промокод не найден. Попробуйте LUMIERE10 или NIGHT20.',
      });
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const errors = validateBookingForm(
      { customerName, customerEmail, customerPhone },
      selectedSeatDetails.length,
    );
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          showtimeId: showtime.id,
          seatIds: selectedSeatDetails.map((s) => s.id),
          snacks: selectedSnacks.map((s) => ({ snackId: s.snackId, quantity: s.quantity })),
          customerName,
          customerEmail,
          customerPhone,
          paymentMethod,
          promoCode: appliedPromo,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        if (data.fieldErrors) {
          setFormErrors(data.fieldErrors);
        }
        setSubmitError(data.error || 'Не удалось оформить бронирование');
        if (response.status === 409) {
          const seatsRes = await fetch(`/api/showtimes/${showtime.id}/seats`);
          if (seatsRes.ok) {
            const seatsJson = await seatsRes.json();
            if (Array.isArray(seatsJson.occupiedSeats)) {
              setOccupiedSeats(seatsJson.occupiedSeats);
              setSelectedSeatIds((prev) =>
                prev.filter((id) => !seatsJson.occupiedSeats.includes(id)),
              );
            }
          }
          setStep('seats');
        }
        return;
      }

      setConfirmedBooking(data.booking);
      onBookingCreated(data.booking);
      setStep('confirmed');
    } catch {
      setSubmitError('Ошибка соединения с сервером. Попробуйте ещё раз.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto bg-[#131519] border border-white/15 rounded-xl shadow-2xl">
        {/* Top bar of modal */}
        <div className="sticky top-0 z-20 flex items-center justify-between gap-4 px-6 py-4 bg-[#131519]/95 backdrop-blur-md border-b border-white/10">
          <div className="min-w-0">
            <p className="text-xs text-[#E5A93C] font-medium tabular-nums truncate">
              {showtime.dateLabel}, {showtime.time} · {showtime.hallName} · {showtime.format}
            </p>
            <h2
              id="booking-modal-title"
              className="font-display text-xl sm:text-2xl font-semibold text-[#F4F4F5] truncate"
            >
              {movie.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть окно бронирования"
            className="p-2 rounded-lg text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#1C1F26] border border-white/10 cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5A93C]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Seats & Snacks */}
        {step === 'seats' && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-0">
            {/* Left: Interactive Seat Map + Snacks */}
            <div className="p-6 sm:p-8 lg:border-r border-white/10">
              <div className="mb-6">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <h3 className="text-base font-semibold text-[#F4F4F5]">
                    Выберите места на схеме зала
                  </h3>
                  {loadingSeats && (
                    <span className="text-xs text-[#A1A1AA]">Обновляем занятость мест...</span>
                  )}
                </div>

                {/* Curved Cinema Screen */}
                <div className="mb-8 flex flex-col items-center">
                  <svg
                    viewBox="0 0 400 26"
                    className="w-full max-w-md h-6"
                    aria-hidden="true"
                  >
                    <path
                      d="M 12 22 Q 200 2 388 22"
                      fill="none"
                      stroke="#E5A93C"
                      strokeWidth="3"
                      strokeLinecap="round"
                      opacity="0.85"
                    />
                  </svg>
                  <span className="text-[11px] tracking-widest text-[#71717A] uppercase">
                    Экран
                  </span>
                </div>

                {/* Seat Grid */}
                <div
                  className="overflow-x-auto pb-2"
                  data-testid="seat-map-container"
                >
                  <div className="min-w-[440px] flex flex-col items-center gap-2">
                    {rowsGrouped.map((rowSeats, rowIdx) => {
                      const rowNum = rowIdx + 1;
                      return (
                        <div key={rowNum} className="flex items-center gap-3">
                          <span className="w-6 text-right font-mono text-xs text-[#71717A] tabular-nums select-none">
                            {rowNum}
                          </span>

                          <div className="flex items-center gap-1.5">
                            {rowSeats.map((seat) => {
                              const isSelected = selectedSeatIds.includes(seat.id);
                              const seatPrice = calculateSeatPrice(showtime.basePrice, seat.tier);
                              const tierLabel = getSeatTierLabel(seat.tier);
                              const aisleGap =
                                seat.number === Math.floor(dimensions.seatsPerRow / 2)
                                  ? 'mr-3'
                                  : '';

                              let seatClasses =
                                'w-8 h-8 rounded-md text-xs font-mono font-medium tabular-nums transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5A93C] ';

                              if (seat.occupied) {
                                seatClasses +=
                                  'bg-[#181A20] text-[#52525B] border border-white/5 cursor-not-allowed';
                              } else if (isSelected) {
                                seatClasses +=
                                  'bg-[#E5A93C] text-[#0B0C0E] border border-[#E5A93C] font-semibold cursor-pointer';
                              } else if (seat.tier === 'vip') {
                                seatClasses +=
                                  'bg-[#2A2218] text-[#F5D08A] border border-[#E5A93C]/40 hover:bg-[#3A2E1F] cursor-pointer';
                              } else if (seat.tier === 'comfort') {
                                seatClasses +=
                                  'bg-[#1C1F26] text-[#E4E4E7] border border-white/20 hover:border-[#E5A93C] cursor-pointer';
                              } else {
                                seatClasses +=
                                  'bg-[#15181E] text-[#A1A1AA] border border-white/10 hover:border-[#E5A93C] hover:text-[#F4F4F5] cursor-pointer';
                              }

                              const ariaState = seat.occupied
                                ? 'занято'
                                : isSelected
                                  ? 'выбрано'
                                  : 'свободно';

                              return (
                                <button
                                  key={seat.id}
                                  type="button"
                                  disabled={seat.occupied}
                                  onClick={() => toggleSeat(seat)}
                                  title={`Ряд ${seat.row}, место ${seat.number} · ${tierLabel} · ${formatCurrency(seatPrice)}`}
                                  aria-label={`Ряд ${seat.row}, место ${seat.number}, ${tierLabel}, ${seatPrice} рублей, ${ariaState}`}
                                  aria-pressed={isSelected}
                                  className={`${seatClasses} ${aisleGap}`}
                                >
                                  {seat.occupied ? '×' : seat.number}
                                </button>
                              );
                            })}
                          </div>

                          <span className="w-6 text-left font-mono text-xs text-[#71717A] tabular-nums select-none">
                            {rowNum}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Legend */}
                <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-center gap-5 text-xs text-[#A1A1AA] tabular-nums">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded bg-[#15181E] border border-white/10 inline-block" />
                    <span>Стандарт · {formatCurrency(calculateSeatPrice(showtime.basePrice, 'standard'))}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded bg-[#1C1F26] border border-white/20 inline-block" />
                    <span>Комфорт · {formatCurrency(calculateSeatPrice(showtime.basePrice, 'comfort'))}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded bg-[#2A2218] border border-[#E5A93C]/40 inline-block" />
                    <span>VIP Диван · {formatCurrency(calculateSeatPrice(showtime.basePrice, 'vip'))}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded bg-[#E5A93C] inline-block" />
                    <span>Выбрано</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded bg-[#181A20] border border-white/5 inline-flex items-center justify-center text-[10px] text-[#52525B]">
                      ×
                    </span>
                    <span>Занято</span>
                  </div>
                </div>
              </div>

              {/* Optional Cinema Bar Add-ons */}
              <div className="mt-8 pt-6 border-t border-white/10">
                <h3 className="text-base font-semibold text-[#F4F4F5] mb-1">
                  Добавить из кинобара
                </h3>
                <p className="text-xs text-[#71717A] mb-4">
                  Необязательно — выдадим по номеру заказа на стойке бара.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {snacksCatalog.map((snack) => {
                    const qty = snackQuantities[snack.id] ?? 0;
                    return (
                      <div
                        key={snack.id}
                        className="flex items-center justify-between gap-3 p-3.5 rounded-lg bg-[#0F1114] border border-white/10"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[#F4F4F5] leading-snug">
                            {snack.name}
                          </p>
                          <p className="text-xs text-[#71717A] tabular-nums mt-0.5">
                            {snack.volume} · {formatCurrency(snack.price)}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => adjustSnack(snack.id, -1)}
                            disabled={qty === 0}
                            aria-label={`Убрать ${snack.name}`}
                            className="w-7 h-7 rounded-md bg-[#1C1F26] text-[#F4F4F5] disabled:opacity-35 flex items-center justify-center border border-white/10 cursor-pointer disabled:cursor-not-allowed"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-6 text-center font-mono text-xs tabular-nums text-[#F4F4F5]">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => adjustSnack(snack.id, 1)}
                            aria-label={`Добавить ${snack.name}`}
                            className="w-7 h-7 rounded-md bg-[#1C1F26] hover:bg-[#E5A93C] text-[#F4F4F5] hover:text-[#0B0C0E] flex items-center justify-center border border-white/10 cursor-pointer transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Order Summary */}
            <aside className="p-6 bg-[#0F1114] flex flex-col justify-between gap-6">
              <div>
                <h3 className="text-base font-semibold text-[#F4F4F5] pb-3 border-b border-white/10">
                  Ваш заказ
                </h3>

                {submitError && (
                  <p role="alert" className="mt-3 p-3 text-xs text-red-300 bg-red-950/50 border border-red-500/30 rounded-lg">
                    {submitError}
                  </p>
                )}

                {selectedSeatDetails.length === 0 ? (
                  <p className="mt-5 text-sm text-[#71717A]">
                    Нажмите на свободные кресла на схеме зала, чтобы добавить билеты в заказ.
                  </p>
                ) : (
                  <ul className="mt-4 space-y-2.5" aria-label="Выбранные места">
                    {selectedSeatDetails.map((seat) => (
                      <li
                        key={seat.id}
                        className="flex items-center justify-between gap-2 text-sm py-1.5 border-b border-white/5"
                      >
                        <div>
                          <p className="text-[#F4F4F5] font-medium tabular-nums">
                            {formatSeatShort(seat.row, seat.number)}
                          </p>
                          <p className="text-xs text-[#71717A]">{getSeatTierLabel(seat.tier)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm text-[#F4F4F5] tabular-nums">
                            {formatCurrency(seat.price)}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedSeatIds((prev) => prev.filter((id) => id !== seat.id))
                            }
                            aria-label={`Удалить ${formatSeatShort(seat.row, seat.number)}`}
                            className="text-[#71717A] hover:text-[#F4F4F5] cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                {selectedSnacks.length > 0 && (
                  <div className="mt-5 pt-4 border-t border-white/10">
                    <p className="text-xs font-medium text-[#A1A1AA] mb-2">Кинобар</p>
                    <ul className="space-y-1.5 text-xs">
                      {selectedSnacks.map((snack) => (
                        <li
                          key={snack.snackId}
                          className="flex justify-between gap-2 text-[#D4D4D8]"
                        >
                          <span>
                            {snack.name} × {snack.quantity}
                          </span>
                          <span className="font-mono tabular-nums">
                            {formatCurrency(snack.unitPrice * snack.quantity)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-white/10 space-y-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-[#A1A1AA]">Итого к оплате</span>
                  <span className="font-mono text-2xl font-semibold text-[#F4F4F5] tabular-nums">
                    {formatCurrency(totals.grandTotal)}
                  </span>
                </div>

                <button
                  type="button"
                  disabled={selectedSeatDetails.length === 0}
                  onClick={() => {
                    setSubmitError(null);
                    setStep('checkout');
                  }}
                  className="w-full py-3 px-4 text-sm font-semibold text-[#0B0C0E] bg-[#E5A93C] hover:bg-[#EEB955] disabled:bg-[#27272A] disabled:text-[#71717A] rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  Перейти к оформлению
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* Step 2: Checkout Form */}
        {step === 'checkout' && (
          <form onSubmit={handleSubmitOrder} noValidate className="p-6 sm:p-8">
            <button
              type="button"
              onClick={() => setStep('seats')}
              className="inline-flex items-center gap-2 text-xs font-medium text-[#A1A1AA] hover:text-[#F4F4F5] mb-6 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <span>Вернуться к выбору мест</span>
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-[#F4F4F5]">Контактные данные</h3>
                  <p className="mt-1 text-xs text-[#71717A]">
                    Отправим электронный билет с QR-кодом и кодом брони на почту.
                  </p>
                </div>

                {submitError && (
                  <div
                    role="alert"
                    className="p-3.5 text-sm text-red-300 bg-red-950/50 border border-red-500/30 rounded-lg"
                  >
                    {submitError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="booking-name"
                      className="block text-xs font-medium text-[#D4D4D8] mb-1.5"
                    >
                      Имя и фамилия
                    </label>
                    <input
                      id="booking-name"
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Алексей Смирнов"
                      className="w-full px-3.5 py-2.5 text-sm bg-[#0B0C0E] text-[#F4F4F5] border border-white/15 rounded-lg focus:outline-none focus:border-[#E5A93C]"
                    />
                    {formErrors.customerName && (
                      <p className="mt-1 text-xs text-red-400">{formErrors.customerName}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="booking-email"
                      className="block text-xs font-medium text-[#D4D4D8] mb-1.5"
                    >
                      Электронная почта
                    </label>
                    <input
                      id="booking-email"
                      type="email"
                      required
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="alexey@example.ru"
                      className="w-full px-3.5 py-2.5 text-sm bg-[#0B0C0E] text-[#F4F4F5] border border-white/15 rounded-lg focus:outline-none focus:border-[#E5A93C]"
                    />
                    {formErrors.customerEmail && (
                      <p className="mt-1 text-xs text-red-400">{formErrors.customerEmail}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="booking-phone"
                      className="block text-xs font-medium text-[#D4D4D8] mb-1.5"
                    >
                      Телефон
                    </label>
                    <input
                      id="booking-phone"
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="+7 999 123-45-67"
                      className="w-full px-3.5 py-2.5 text-sm bg-[#0B0C0E] text-[#F4F4F5] border border-white/15 rounded-lg focus:outline-none focus:border-[#E5A93C]"
                    />
                    {formErrors.customerPhone && (
                      <p className="mt-1 text-xs text-red-400">{formErrors.customerPhone}</p>
                    )}
                  </div>
                </div>

                {/* Payment method */}
                <fieldset className="pt-2">
                  <legend className="text-sm font-semibold text-[#F4F4F5] mb-3">
                    Способ оплаты
                  </legend>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(
                      [
                        { id: 'card', title: 'Банковская карта', note: 'Мир, Visa, Mastercard' },
                        { id: 'sbp', title: 'СБП', note: 'Мгновенно по QR-коду' },
                        { id: 'boxoffice', title: 'Оплата на кассе', note: 'Выкуп за 20 мин' },
                      ] as const
                    ).map((method) => {
                      const active = paymentMethod === method.id;
                      return (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => setPaymentMethod(method.id)}
                          aria-pressed={active}
                          className={`p-3.5 rounded-lg border text-left transition-colors cursor-pointer ${
                            active
                              ? 'bg-[#1C1F26] border-[#E5A93C] text-[#F4F4F5]'
                              : 'bg-[#0F1114] border-white/10 text-[#A1A1AA] hover:border-white/25'
                          }`}
                        >
                          <p className="text-sm font-medium text-[#F4F4F5]">{method.title}</p>
                          <p className="mt-0.5 text-xs text-[#71717A]">{method.note}</p>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                {/* Promo code */}
                <div className="pt-2">
                  <label
                    htmlFor="promo-code"
                    className="block text-xs font-medium text-[#D4D4D8] mb-1.5"
                  >
                    Промокод (например, LUMIERE10)
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="promo-code"
                      type="text"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      placeholder="Введите промокод"
                      className="flex-1 px-3.5 py-2 text-sm font-mono uppercase bg-[#0B0C0E] text-[#F4F4F5] border border-white/15 rounded-lg focus:outline-none focus:border-[#E5A93C]"
                    />
                    <button
                      type="button"
                      onClick={handleApplyPromo}
                      className="px-4 py-2 text-xs font-semibold text-[#F4F4F5] bg-[#1C1F26] hover:bg-[#272B35] border border-white/15 rounded-lg cursor-pointer whitespace-nowrap"
                    >
                      Применить
                    </button>
                  </div>
                  {promoFeedback && (
                    <p
                      className={`mt-1.5 text-xs ${
                        promoFeedback.type === 'ok' ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {promoFeedback.text}
                    </p>
                  )}
                </div>
              </div>

              {/* Order recap sidebar */}
              <div className="p-5 rounded-xl bg-[#0F1114] border border-white/10 h-fit space-y-4">
                <h4 className="text-sm font-semibold text-[#F4F4F5] pb-3 border-b border-white/10">
                  Состав заказа
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-[#D4D4D8]">
                    <span>Билеты ({selectedSeatDetails.length} шт.)</span>
                    <span className="font-mono tabular-nums">
                      {formatCurrency(totals.ticketsSubtotal)}
                    </span>
                  </div>
                  {totals.snacksSubtotal > 0 && (
                    <div className="flex justify-between text-[#D4D4D8]">
                      <span>Кинобар</span>
                      <span className="font-mono tabular-nums">
                        {formatCurrency(totals.snacksSubtotal)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-[#A1A1AA]">
                    <span>Сервисный сбор</span>
                    <span className="font-mono tabular-nums">0 ₽</span>
                  </div>
                  {totals.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Скидка по промокоду</span>
                      <span className="font-mono tabular-nums">
                        −{formatCurrency(totals.discountAmount)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-white/10 flex items-baseline justify-between">
                  <span className="text-sm text-[#A1A1AA]">К оплате</span>
                  <span className="font-mono text-2xl font-semibold text-[#F4F4F5] tabular-nums">
                    {formatCurrency(totals.grandTotal)}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 px-4 text-sm font-semibold text-[#0B0C0E] bg-[#E5A93C] hover:bg-[#EEB955] disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
                >
                  {submitting
                    ? 'Оформляем бронь...'
                    : `Подтвердить бронь · ${formatCurrency(totals.grandTotal)}`}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Step 3: Confirmation Ticket */}
        {step === 'confirmed' && confirmedBooking && (
          <div className="p-6 sm:p-10 max-w-2xl mx-auto">
            <div className="flex items-center gap-3 text-emerald-400 mb-3">
              <CheckCircle2 className="w-6 h-6 shrink-0" aria-hidden="true" />
              <span className="text-sm font-semibold">Бронирование подтверждено</span>
            </div>

            <h3 className="font-display text-3xl font-semibold text-[#F4F4F5]">
              Ждём вас на сеансе «{confirmedBooking.movieTitle}»
            </h3>
            <p className="mt-2 text-sm text-[#A1A1AA]">
              Покажите этот QR-код контролёру при входе в {confirmedBooking.hallName} или назовите код брони.
            </p>

            <div className="mt-6 p-6 rounded-xl bg-[#0F1114] border border-white/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-xs text-[#71717A]">Код бронирования</span>
                  <p
                    data-testid="confirmed-booking-code"
                    className="font-mono text-2xl font-semibold text-[#E5A93C] tabular-nums"
                  >
                    {confirmedBooking.bookingCode}
                  </p>
                </div>

                <p className="text-[#D4D4D8] tabular-nums">
                  {confirmedBooking.dateLabel}, {confirmedBooking.time} · {confirmedBooking.hallName}
                </p>

                <p className="text-[#F4F4F5] font-medium tabular-nums">
                  Места:{' '}
                  {confirmedBooking.seats
                    .map((s) => formatSeatShort(s.row, s.number))
                    .join('; ')}
                </p>

                {confirmedBooking.snacks.length > 0 && (
                  <p className="text-xs text-[#A1A1AA]">
                    Кинобар:{' '}
                    {confirmedBooking.snacks.map((s) => `${s.name} × ${s.quantity}`).join(', ')}
                  </p>
                )}

                <p className="text-xs text-[#71717A] tabular-nums">
                  Итого: {formatCurrency(confirmedBooking.totals.grandTotal)} · Гость:{' '}
                  {confirmedBooking.customerName}
                </p>
              </div>

              <QrMatrix code={confirmedBooking.bookingCode} size={108} />
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenMyTickets();
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-[#0B0C0E] bg-[#E5A93C] hover:bg-[#EEB955] rounded-lg cursor-pointer"
              >
                <Ticket className="w-4 h-4" aria-hidden="true" />
                <span>Открыть мои билеты</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-medium text-[#F4F4F5] bg-[#1C1F26] hover:bg-[#272B35] border border-white/10 rounded-lg cursor-pointer"
              >
                Вернуться к афише
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
