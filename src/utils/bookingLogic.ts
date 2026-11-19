import type {
  BookingFormErrors,
  BookingFormValues,
  HallType,
  Movie,
  OrderTotals,
  Seat,
  SeatTier,
  SelectedSeatDetail,
  SelectedSnack,
  ShowtimeDateKey,
  ShowtimeFormat,
} from '../types/cinema';

export interface HallDimensions {
  rows: number;
  seatsPerRow: number;
}

export function getHallDimensions(hallType: HallType): HallDimensions {
  switch (hallType) {
    case 'IMAX':
      return { rows: 8, seatsPerRow: 12 };
    case 'DOLBY':
      return { rows: 7, seatsPerRow: 10 };
    case 'ARTHOUSE':
      return { rows: 5, seatsPerRow: 8 };
  }
}

export function getSeatTierForRow(row: number, totalRows: number, hallType: HallType): SeatTier {
  if (row >= totalRows - 1) {
    return 'vip';
  }
  if (hallType === 'ARTHOUSE') {
    return 'comfort';
  }
  if (row >= 3) {
    return 'comfort';
  }
  return 'standard';
}

export function generateSeatMap(hallType: HallType, occupiedSeatIds: string[]): Seat[] {
  const { rows, seatsPerRow } = getHallDimensions(hallType);
  const occupiedSet = new Set(occupiedSeatIds);
  const seats: Seat[] = [];

  for (let r = 1; r <= rows; r++) {
    const tier = getSeatTierForRow(r, rows, hallType);
    for (let s = 1; s <= seatsPerRow; s++) {
      const id = `R${r}-S${s}`;
      seats.push({
        id,
        row: r,
        number: s,
        tier,
        occupied: occupiedSet.has(id),
      });
    }
  }

  return seats;
}

export function calculateSeatPrice(basePrice: number, tier: SeatTier): number {
  switch (tier) {
    case 'standard':
      return Math.round(basePrice);
    case 'comfort':
      return Math.round(basePrice + 150);
    case 'vip':
      return Math.round(basePrice + 350);
  }
}

export function getSeatTierLabel(tier: SeatTier): string {
  switch (tier) {
    case 'standard':
      return 'Стандарт';
    case 'comfort':
      return 'Комфорт';
    case 'vip':
      return 'VIP Диван';
  }
}

export interface PromoResult {
  valid: boolean;
  discountPercent: number;
  appliesTo: 'tickets' | 'all';
  label: string | null;
}

export function evaluatePromoCode(code: string): PromoResult {
  const normalized = code.trim().toUpperCase();
  if (!normalized) {
    return { valid: false, discountPercent: 0, appliesTo: 'tickets', label: null };
  }
  if (normalized === 'LUMIERE10') {
    return {
      valid: true,
      discountPercent: 10,
      appliesTo: 'tickets',
      label: 'Промокод LUMIERE10 (−10% на билеты)',
    };
  }
  if (normalized === 'NIGHT20') {
    return {
      valid: true,
      discountPercent: 20,
      appliesTo: 'tickets',
      label: 'Промокод NIGHT20 (−20% на билеты)',
    };
  }
  if (normalized === 'VIP15') {
    return {
      valid: true,
      discountPercent: 15,
      appliesTo: 'all',
      label: 'Промокод VIP15 (−15% на весь заказ)',
    };
  }
  return { valid: false, discountPercent: 0, appliesTo: 'tickets', label: null };
}

export function calculateOrderTotals(
  selectedSeats: SelectedSeatDetail[],
  snacks: SelectedSnack[],
  promoCode: string,
): OrderTotals {
  const ticketsSubtotal = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
  const snacksSubtotal = snacks.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  const promo = evaluatePromoCode(promoCode);
  let discountAmount = 0;

  if (promo.valid) {
    const discountBase =
      promo.appliesTo === 'all' ? ticketsSubtotal + snacksSubtotal : ticketsSubtotal;
    discountAmount = Math.round((discountBase * promo.discountPercent) / 100);
  }

  const grandTotal = Math.max(0, ticketsSubtotal + snacksSubtotal - discountAmount);

  return {
    ticketsSubtotal,
    snacksSubtotal,
    discountAmount,
    promoLabel: promo.label,
    grandTotal,
  };
}

export function validateBookingForm(
  values: Pick<BookingFormValues, 'customerName' | 'customerEmail' | 'customerPhone'>,
  selectedSeatsCount: number,
): BookingFormErrors {
  const errors: BookingFormErrors = {};

  if (selectedSeatsCount <= 0) {
    errors.seats = 'Выберите хотя бы одно место в зале';
  }

  if (values.customerName.trim().length < 2) {
    errors.customerName = 'Укажите имя и фамилию (минимум 2 символа)';
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!emailPattern.test(values.customerEmail.trim())) {
    errors.customerEmail = 'Введите корректный адрес электронной почты';
  }

  const phoneDigits = values.customerPhone.replace(/\D/g, '');
  if (phoneDigits.length < 10) {
    errors.customerPhone = 'Введите номер телефона (минимум 10 цифр)';
  }

  return errors;
}

export interface MovieFilterCriteria {
  query: string;
  genre: string;
  format: 'all' | ShowtimeFormat;
  date: 'all' | ShowtimeDateKey;
}

export function filterMovies(movies: Movie[], criteria: MovieFilterCriteria): Movie[] {
  const q = criteria.query.trim().toLowerCase();

  return movies.filter((movie) => {
    if (q) {
      const matchesTitle = movie.title.toLowerCase().includes(q);
      const matchesOrig = movie.originalTitle.toLowerCase().includes(q);
      const matchesDirector = movie.director.toLowerCase().includes(q);
      const matchesGenre = movie.genre.toLowerCase().includes(q);
      if (!matchesTitle && !matchesOrig && !matchesDirector && !matchesGenre) {
        return false;
      }
    }

    if (criteria.genre !== 'all' && movie.genre !== criteria.genre) {
      return false;
    }

    const matchingShowtimes = movie.showtimes.filter((st) => {
      if (criteria.date !== 'all' && st.dateKey !== criteria.date) {
        return false;
      }
      if (criteria.format !== 'all' && st.format !== criteria.format) {
        return false;
      }
      return true;
    });

    return matchingShowtimes.length > 0;
  });
}

export function formatCurrency(amount: number): string {
  return `${amount.toLocaleString('ru-RU')} ₽`;
}

export function formatSeatShort(row: number, number: number): string {
  return `Ряд ${row}, место ${number}`;
}

export function generateBookingCode(seed?: number): string {
  const num = seed !== undefined ? seed : Math.floor(1000 + Math.random() * 9000);
  return `LM-${String(num).padStart(4, '0')}`;
}
