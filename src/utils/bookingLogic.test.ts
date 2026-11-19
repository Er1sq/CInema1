import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateOrderTotals,
  calculateSeatPrice,
  evaluatePromoCode,
  filterMovies,
  generateSeatMap,
  validateBookingForm,
} from './bookingLogic';
import { getSeedMovies } from '../data/cinemaData';

test('generateSeatMap creates exact hall geometry and marks occupied seats', () => {
  const imaxSeats = generateSeatMap('IMAX', ['R4-S6', 'R8-S12']);
  assert.equal(imaxSeats.length, 96);

  const seatR1S1 = imaxSeats.find((s) => s.id === 'R1-S1');
  const seatR4S6 = imaxSeats.find((s) => s.id === 'R4-S6');
  const seatR8S12 = imaxSeats.find((s) => s.id === 'R8-S12');

  assert.equal(seatR1S1?.tier, 'standard');
  assert.equal(seatR1S1?.occupied, false);
  assert.equal(seatR4S6?.tier, 'comfort');
  assert.equal(seatR4S6?.occupied, true);
  assert.equal(seatR8S12?.tier, 'vip');
  assert.equal(seatR8S12?.occupied, true);
});

test('calculateSeatPrice applies tier increments deterministically', () => {
  assert.equal(calculateSeatPrice(600, 'standard'), 600);
  assert.equal(calculateSeatPrice(600, 'comfort'), 750);
  assert.equal(calculateSeatPrice(600, 'vip'), 950);
});

test('calculateOrderTotals computes tickets, snacks, and LUMIERE10 promo code', () => {
  const seats = [
    { id: 'R4-S5', row: 4, number: 5, tier: 'comfort' as const, price: 800 },
    { id: 'R4-S6', row: 4, number: 6, tier: 'comfort' as const, price: 800 },
  ];
  const snacks = [
    { snackId: 'snack-caramel-l', name: 'Карамельный попкорн', unitPrice: 490, quantity: 1 },
  ];

  const noPromo = calculateOrderTotals(seats, snacks, '');
  assert.equal(noPromo.ticketsSubtotal, 1600);
  assert.equal(noPromo.snacksSubtotal, 490);
  assert.equal(noPromo.discountAmount, 0);
  assert.equal(noPromo.grandTotal, 2090);

  const withPromo = calculateOrderTotals(seats, snacks, 'lumiere10');
  assert.equal(withPromo.discountAmount, 160);
  assert.equal(withPromo.grandTotal, 1930);
  assert.ok(withPromo.promoLabel?.includes('LUMIERE10'));

  const vipPromo = calculateOrderTotals(seats, snacks, 'VIP15');
  assert.equal(vipPromo.discountAmount, Math.round((1600 + 490) * 0.15));
  assert.equal(vipPromo.grandTotal, 2090 - vipPromo.discountAmount);
});

test('evaluatePromoCode rejects unknown codes', () => {
  const bad = evaluatePromoCode('FREE100');
  assert.equal(bad.valid, false);
  assert.equal(bad.discountPercent, 0);
});

test('validateBookingForm catches missing seats and invalid customer fields', () => {
  const emptyErrors = validateBookingForm(
    { customerName: 'А', customerEmail: 'bad-email', customerPhone: '123' },
    0,
  );
  assert.ok(emptyErrors.seats);
  assert.ok(emptyErrors.customerName);
  assert.ok(emptyErrors.customerEmail);
  assert.ok(emptyErrors.customerPhone);

  const validErrors = validateBookingForm(
    { customerName: 'Иван Петров', customerEmail: 'ivan@example.com', customerPhone: '+7 999 123-45-67' },
    2,
  );
  assert.deepEqual(validErrors, {});
});

test('filterMovies filters by genre, format, date, and search query', () => {
  const movies = getSeedMovies();

  const sciFi = filterMovies(movies, { query: '', genre: 'Фантастика', format: 'all', date: 'all' });
  assert.equal(sciFi.length, 1);
  assert.equal(sciFi[0].id, 'horizon-zero');

  const imaxToday = filterMovies(movies, { query: '', genre: 'all', format: 'IMAX', date: 'today' });
  assert.equal(imaxToday.length, 2);

  const searchDirector = filterMovies(movies, { query: 'Моро', genre: 'all', format: 'all', date: 'all' });
  assert.equal(searchDirector.length, 1);
  assert.equal(searchDirector[0].id, 'night-tram');
});
