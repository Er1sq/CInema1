import { useState } from 'react';
import { Bell, Check, Film } from 'lucide-react';
import type { HallInfo, SnackItem, UpcomingMovie } from '../types/cinema';
import { formatCurrency } from '../utils/bookingLogic';

interface HallsAndBarSectionProps {
  halls: HallInfo[];
  snacks: SnackItem[];
  upcoming: UpcomingMovie[];
  remindedIds: string[];
  onToggleRemind: (id: string) => void;
}

function UpcomingThumb({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="w-full h-full bg-[#1C1F26] flex items-center justify-center">
        <Film className="w-6 h-6 text-white/20" aria-hidden="true" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="w-full h-full object-cover"
    />
  );
}

export function HallsAndBarSection({
  halls,
  snacks,
  upcoming,
  remindedIds,
  onToggleRemind,
}: HallsAndBarSectionProps) {
  return (
    <>
      {/* Залы и форматы */}
      <section id="halls" className="py-16 border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-xs font-medium text-[#E5A93C] mb-2">Архитектура звука и света</p>
              <h2 className="font-display text-3xl font-semibold text-[#F4F4F5] text-balance">
                Три зала под разные задачи кино
              </h2>
            </div>
            <p className="text-sm text-[#A1A1AA] max-w-md">
              В каждом зале выверены углы обзора, расстояние между рядами не менее 115 см и калиброванная цветопередача.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {halls.map((hall) => (
              <div
                key={hall.id}
                className="bg-[#131519] border border-white/10 rounded-xl p-6 flex flex-col justify-between gap-6"
              >
                <div>
                  <h3 className="font-display text-xl font-semibold text-[#F4F4F5]">
                    {hall.name}
                  </h3>
                  <p className="mt-3 text-sm text-[#D4D4D8] leading-relaxed">
                    {hall.description}
                  </p>
                </div>

                <dl className="pt-4 border-t border-white/10 space-y-2.5 text-xs">
                  <div className="flex justify-between gap-4">
                    <dt className="text-[#71717A]">Экран</dt>
                    <dd className="text-[#F4F4F5] font-medium text-right tabular-nums">
                      {hall.screenSpec}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-[#71717A]">Звук</dt>
                    <dd className="text-[#F4F4F5] font-medium text-right">{hall.soundSpec}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-[#71717A]">Посадка</dt>
                    <dd className="text-[#A1A1AA] text-right tabular-nums">
                      {hall.rows * hall.seatsPerRow} мест
                    </dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Кинобар */}
      <section id="bar" className="py-16 border-t border-white/10 bg-[#0F1114]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-xs font-medium text-[#E5A93C] mb-2">Предзаказ к сеансу</p>
              <h2 className="font-display text-3xl font-semibold text-[#F4F4F5]">
                Кинобар без очереди
              </h2>
            </div>
            <p className="text-sm text-[#A1A1AA] max-w-md">
              Любую позицию из меню можно добавить при оформлении билетов — заказ соберут к вашему приходу за 10 минут до сеанса.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {snacks.map((snack) => (
              <div
                key={snack.id}
                className="bg-[#131519] border border-white/10 rounded-xl p-5 flex flex-col justify-between gap-4"
              >
                <div>
                  <p className="text-xs text-[#71717A]">
                    {snack.category} · {snack.volume}
                  </p>
                  <h3 className="mt-1.5 text-base font-semibold text-[#F4F4F5]">
                    {snack.name}
                  </h3>
                  <p className="mt-2 text-sm text-[#A1A1AA] leading-relaxed">
                    {snack.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="font-mono text-base font-semibold text-[#F4F4F5] tabular-nums">
                    {formatCurrency(snack.price)}
                  </span>
                  <span className="text-xs text-[#71717A]">Доступно при бронировании</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Скоро в прокате */}
      <section id="soon" className="py-16 border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-10">
            <p className="text-xs font-medium text-[#E5A93C] mb-2">Ближайшие премьеры</p>
            <h2 className="font-display text-3xl font-semibold text-[#F4F4F5]">
              Скоро в «Люмьере»
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {upcoming.map((item) => {
              const isReminded = remindedIds.includes(item.id);
              return (
                <article
                  key={item.id}
                  className="bg-[#131519] border border-white/10 rounded-xl p-5 flex flex-col justify-between gap-5"
                >
                  <div className="flex gap-4">
                    <div className="w-20 aspect-[3/4] rounded-lg overflow-hidden shrink-0 bg-[#1C1F26]">
                      <UpcomingThumb src={item.posterUrl} alt={item.title} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-[#E5A93C] font-medium tabular-nums">
                        С {item.releaseDate}
                      </p>
                      <h3 className="mt-1 font-display text-lg font-semibold text-[#F4F4F5] leading-snug">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-xs text-[#A1A1AA]">{item.genre}</p>
                      <p className="mt-2 text-xs text-[#71717A] leading-relaxed">{item.note}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onToggleRemind(item.id)}
                    aria-pressed={isReminded}
                    className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                      isReminded
                        ? 'bg-[#1C1F26] text-[#E5A93C] border-[#E5A93C]/50'
                        : 'bg-transparent text-[#D4D4D8] border-white/15 hover:border-white/30 hover:text-[#F4F4F5]'
                    }`}
                  >
                    {isReminded ? (
                      <>
                        <Check className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Уведомление включено</span>
                      </>
                    ) : (
                      <>
                        <Bell className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Напомнить о старте продаж</span>
                      </>
                    )}
                  </button>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
