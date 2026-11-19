export type HallType = 'IMAX' | 'DOLBY' | 'ARTHOUSE';

export type ShowtimeFormat = 'IMAX' | 'Dolby Atmos' | '2D' | 'Оригинал с субтитрами';

export type ShowtimeDateKey = 'today' | 'tomorrow' | 'weekend';

export type SeatTier = 'standard' | 'comfort' | 'vip';

export type PaymentMethod = 'card' | 'sbp' | 'boxoffice';

export interface Seat {
  id: string; // e.g. "R4-S6"
  row: number;
  number: number;
  tier: SeatTier;
  occupied: boolean;
}

export interface HallInfo {
  id: string;
  name: string;
  type: HallType;
  rows: number;
  seatsPerRow: number;
  screenSpec: string;
  soundSpec: string;
  seatingNote: string;
  description: string;
}

export interface Showtime {
  id: string;
  movieId: string;
  hallId: string;
  hallName: string;
  hallType: HallType;
  dateKey: ShowtimeDateKey;
  dateLabel: string;
  time: string;
  format: ShowtimeFormat;
  basePrice: number;
  initialOccupiedSeats: string[];
  occupiedSeats: string[];
}

export interface Movie {
  id: string;
  title: string;
  originalTitle: string;
  genre: string;
  durationMin: number;
  ageRating: string;
  country: string;
  year: number;
  rating: string;
  director: string;
  cast: string[];
  logline: string;
  synopsis: string;
  posterUrl: string;
  isFeatured?: boolean;
  formats: ShowtimeFormat[];
  showtimes: Showtime[];
}

export interface UpcomingMovie {
  id: string;
  title: string;
  genre: string;
  releaseDate: string;
  director: string;
  note: string;
  posterUrl: string;
}

export interface SnackItem {
  id: string;
  name: string;
  volume: string;
  price: number;
  category: 'Попкорн' | 'Напитки' | 'Комбо';
  description: string;
}

export interface SelectedSnack {
  snackId: string;
  name: string;
  unitPrice: number;
  quantity: number;
}

export interface SelectedSeatDetail {
  id: string;
  row: number;
  number: number;
  tier: SeatTier;
  price: number;
}

export interface OrderTotals {
  ticketsSubtotal: number;
  snacksSubtotal: number;
  discountAmount: number;
  promoLabel: string | null;
  grandTotal: number;
}

export interface BookingFormValues {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  paymentMethod: PaymentMethod;
  promoCode: string;
}

export interface BookingFormErrors {
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  seats?: string;
}

export interface BookingRecord {
  id: string;
  bookingCode: string;
  showtimeId: string;
  movieId: string;
  movieTitle: string;
  hallName: string;
  format: ShowtimeFormat;
  dateLabel: string;
  time: string;
  seats: SelectedSeatDetail[];
  snacks: SelectedSnack[];
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  paymentMethod: PaymentMethod;
  promoCode: string | null;
  totals: OrderTotals;
  status: 'confirmed' | 'cancelled';
  createdAt: string;
}
