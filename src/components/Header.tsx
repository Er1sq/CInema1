import { useState } from 'react';
import { Menu, Ticket, X } from 'lucide-react';

interface HeaderProps {
  activeTicketsCount: number;
  onOpenTickets: () => void;
}

export function Header({ activeTicketsCount, onOpenTickets }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#0B0C0E]/92 backdrop-blur-md border-b border-white/10">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-element wordmark */}
        <a
          href="#top"
          className="font-display text-2xl font-semibold tracking-tight text-[#F4F4F5] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5A93C] rounded-sm"
        >
          Люмьер
        </a>

        {/* Zone 2: 4 clean single-line navigation links */}
        <nav aria-label="Основная навигация" className="hidden md:flex items-center gap-7">
          <a
            href="#afisha"
            className="text-sm font-medium text-[#A1A1AA] hover:text-[#F4F4F5] transition-colors whitespace-nowrap shrink-0 hover:underline underline-offset-4"
          >
            Афиша
          </a>
          <a
            href="#halls"
            className="text-sm font-medium text-[#A1A1AA] hover:text-[#F4F4F5] transition-colors whitespace-nowrap shrink-0 hover:underline underline-offset-4"
          >
            Залы
          </a>
          <a
            href="#bar"
            className="text-sm font-medium text-[#A1A1AA] hover:text-[#F4F4F5] transition-colors whitespace-nowrap shrink-0 hover:underline underline-offset-4"
          >
            Кинобар
          </a>
          <a
            href="#soon"
            className="text-sm font-medium text-[#A1A1AA] hover:text-[#F4F4F5] transition-colors whitespace-nowrap shrink-0 hover:underline underline-offset-4"
          >
            Скоро
          </a>
        </nav>

        {/* Zone 3: Single primary CTA + mobile drawer toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenTickets}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[#0B0C0E] bg-[#E5A93C] hover:bg-[#EEB955] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5A93C] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0C0E]"
          >
            <Ticket className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="tabular-nums">
              {activeTicketsCount > 0 ? `Мои билеты · ${activeTicketsCount}` : 'Мои билеты'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
            aria-expanded={mobileMenuOpen}
            className="md:hidden p-2 text-[#A1A1AA] hover:text-[#F4F4F5] rounded-lg border border-white/10 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5A93C]"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <nav
          aria-label="Мобильная навигация"
          className="md:hidden border-t border-white/10 bg-[#131519] px-6 py-4 flex flex-col gap-3"
        >
          <a
            href="#afisha"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-medium text-[#E4E4E7] py-1.5"
          >
            Афиша
          </a>
          <a
            href="#halls"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-medium text-[#E4E4E7] py-1.5"
          >
            Залы
          </a>
          <a
            href="#bar"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-medium text-[#E4E4E7] py-1.5"
          >
            Кинобар
          </a>
          <a
            href="#soon"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-medium text-[#E4E4E7] py-1.5"
          >
            Скоро
          </a>
        </nav>
      )}
    </header>
  );
}
