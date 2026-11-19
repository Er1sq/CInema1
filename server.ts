import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';
import { getSeedMovies, HALLS, SNACKS, UPCOMING_MOVIES } from './src/data/cinemaData.ts';
import type { BookingRecord, SelectedSeatDetail, SelectedSnack } from './src/types/cinema.ts';
import {
  calculateOrderTotals,
  calculateSeatPrice,
  generateBookingCode,
  generateSeatMap,
  validateBookingForm,
} from './src/utils/bookingLogic.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');

function ensureStorage(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(BOOKINGS_FILE)) {
    fs.writeFileSync(BOOKINGS_FILE, '[]', 'utf-8');
  }
}

function readBookings(): BookingRecord[] {
  ensureStorage();
  try {
    const raw = fs.readFileSync(BOOKINGS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeBookings(bookings: BookingRecord[]): void {
  ensureStorage();
  fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookings, null, 2), 'utf-8');
}

function getOccupiedSeatsForShowtime(showtimeId: string, initialOccupied: string[]): string[] {
  const bookings = readBookings();
  const occupied = new Set(initialOccupied);
  for (const booking of bookings) {
    if (booking.showtimeId === showtimeId && booking.status === 'confirmed') {
      for (const seat of booking.seats) {
        occupied.add(seat.id);
      }
    }
  }
  return Array.from(occupied);
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // API: Cinema catalog with live occupied seats
  app.get('/api/cinema', (_req, res) => {
    const movies = getSeedMovies().map((movie) => ({
      ...movie,
      showtimes: movie.showtimes.map((st) => ({
        ...st,
        occupiedSeats: getOccupiedSeatsForShowtime(st.id, st.initialOccupiedSeats),
      })),
    }));

    res.json({
      movies,
      halls: HALLS,
      snacks: SNACKS,
      upcoming: UPCOMING_MOVIES,
    });
  });

  // API: Live seat map for a specific showtime
  app.get('/api/showtimes/:showtimeId/seats', (req, res) => {
    const { showtimeId } = req.params;
    const movies = getSeedMovies();
    const foundShowtime = movies.flatMap((m) => m.showtimes).find((st) => st.id === showtimeId);

    if (!foundShowtime) {
      res.status(404).json({ error: 'Сеанс не найден' });
      return;
    }

    const occupiedSeats = getOccupiedSeatsForShowtime(
      foundShowtime.id,
      foundShowtime.initialOccupiedSeats,
    );
    const seats = generateSeatMap(foundShowtime.hallType, occupiedSeats);

    res.json({
      showtimeId: foundShowtime.id,
      occupiedSeats,
      seats,
    });
  });

  // API: List bookings
  app.get('/api/bookings', (req, res) => {
    const codeFilter = typeof req.query.code === 'string' ? req.query.code.trim().toUpperCase() : '';
    let bookings = readBookings();

    if (codeFilter) {
      bookings = bookings.filter((b) => b.bookingCode.toUpperCase().includes(codeFilter));
    }

    bookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json({ bookings });
  });

  // API: Create booking
  app.post('/api/bookings', (req, res) => {
    const {
      showtimeId,
      seatIds,
      snacks: requestedSnacks,
      customerName,
      customerEmail,
      customerPhone,
      paymentMethod,
      promoCode,
    } = req.body ?? {};

    if (!showtimeId || typeof showtimeId !== 'string') {
      res.status(400).json({ error: 'Не указан сеанс для бронирования' });
      return;
    }

    const seatIdList: string[] = Array.isArray(seatIds)
      ? Array.from(new Set(seatIds.filter((s): s is string => typeof s === 'string')))
      : [];

    const validationErrors = validateBookingForm(
      {
        customerName: typeof customerName === 'string' ? customerName : '',
        customerEmail: typeof customerEmail === 'string' ? customerEmail : '',
        customerPhone: typeof customerPhone === 'string' ? customerPhone : '',
      },
      seatIdList.length,
    );

    if (Object.keys(validationErrors).length > 0) {
      res.status(400).json({
        error: 'Проверьте корректность данных формы',
        fieldErrors: validationErrors,
      });
      return;
    }

    const movies = getSeedMovies();
    let targetMovie = null;
    let targetShowtime = null;

    for (const movie of movies) {
      const st = movie.showtimes.find((item) => item.id === showtimeId);
      if (st) {
        targetMovie = movie;
        targetShowtime = st;
        break;
      }
    }

    if (!targetMovie || !targetShowtime) {
      res.status(404).json({ error: 'Выбранный сеанс не найден' });
      return;
    }

    const occupiedSeats = getOccupiedSeatsForShowtime(
      targetShowtime.id,
      targetShowtime.initialOccupiedSeats,
    );
    const fullSeatMap = generateSeatMap(targetShowtime.hallType, occupiedSeats);

    const selectedSeatDetails: SelectedSeatDetail[] = [];
    for (const seatId of seatIdList) {
      const seat = fullSeatMap.find((s) => s.id === seatId);
      if (!seat) {
        res.status(400).json({ error: `Место ${seatId} не существует в данном зале` });
        return;
      }
      if (seat.occupied) {
        res.status(409).json({
          error: `Ряд ${seat.row}, место ${seat.number} уже занято. Пожалуйста, выберите другое место.`,
        });
        return;
      }
      selectedSeatDetails.push({
        id: seat.id,
        row: seat.row,
        number: seat.number,
        tier: seat.tier,
        price: calculateSeatPrice(targetShowtime.basePrice, seat.tier),
      });
    }

    selectedSeatDetails.sort((a, b) => (a.row !== b.row ? a.row - b.row : a.number - b.number));

    const validSnacks: SelectedSnack[] = [];
    if (Array.isArray(requestedSnacks)) {
      for (const reqSnack of requestedSnacks) {
        if (!reqSnack || typeof reqSnack.snackId !== 'string') continue;
        const catalogItem = SNACKS.find((s) => s.id === reqSnack.snackId);
        const qty = Number(reqSnack.quantity);
        if (catalogItem && Number.isInteger(qty) && qty > 0 && qty <= 10) {
          validSnacks.push({
            snackId: catalogItem.id,
            name: catalogItem.name,
            unitPrice: catalogItem.price,
            quantity: qty,
          });
        }
      }
    }

    const normalizedPromo = typeof promoCode === 'string' ? promoCode.trim().toUpperCase() : '';
    const totals = calculateOrderTotals(selectedSeatDetails, validSnacks, normalizedPromo);

    const existing = readBookings();
    const existingCodes = new Set(existing.map((b) => b.bookingCode));
    let bookingCode = generateBookingCode();
    while (existingCodes.has(bookingCode)) {
      bookingCode = generateBookingCode();
    }

    const newBooking: BookingRecord = {
      id: `bk-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      bookingCode,
      showtimeId: targetShowtime.id,
      movieId: targetMovie.id,
      movieTitle: targetMovie.title,
      hallName: targetShowtime.hallName,
      format: targetShowtime.format,
      dateLabel: targetShowtime.dateLabel,
      time: targetShowtime.time,
      seats: selectedSeatDetails,
      snacks: validSnacks,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      customerPhone: customerPhone.trim(),
      paymentMethod:
        paymentMethod === 'sbp' || paymentMethod === 'boxoffice' ? paymentMethod : 'card',
      promoCode: totals.promoLabel ? normalizedPromo : null,
      totals,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };

    existing.unshift(newBooking);
    writeBookings(existing);

    res.status(201).json({ booking: newBooking });
  });

  // API: Cancel booking
  app.patch('/api/bookings/:id/cancel', (req, res) => {
    const { id } = req.params;
    const bookings = readBookings();
    const idx = bookings.findIndex((b) => b.id === id);

    if (idx === -1) {
      res.status(404).json({ error: 'Бронь не найдена' });
      return;
    }

    bookings[idx] = {
      ...bookings[idx],
      status: 'cancelled',
    };
    writeBookings(bookings);

    res.json({ booking: bookings[idx] });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Lumiere Cinema server running at http://localhost:${port}`);
  });
}

startServer();
