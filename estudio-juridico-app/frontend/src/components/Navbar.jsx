/**
 * Navbar.jsx – Barra de navegación principal del dashboard legal.
 * Incluye logo, menú de navegación y estado de conexión con la API.
 */
import { useState } from 'react';
import { Scale, FileText, PlusCircle, Menu, X, Wifi, WifiOff } from 'lucide-react';

const navLinks = [
  { id: 'casos',   label: 'Expedientes', icon: FileText,    path: '/casos'   },
  { id: 'ingesta', label: 'Nueva Ingesta', icon: PlusCircle, path: '/ingesta' },
];

export default function Navbar({ activePage, onNavigate, apiOnline }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 backdrop-blur-md"
         style={{ background: 'rgba(13, 21, 38, 0.85)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onNavigate('casos')}>
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl
                            bg-gradient-to-br from-navy-600 to-navy-800 border border-navy-500/50
                            shadow-glow-blue group-hover:shadow-lg transition-all duration-300">
              <Scale size={20} className="text-gold-400" />
            </div>
            <div>
              <span className="font-serif font-bold text-lg text-white leading-none block">LexTrack</span>
              <span className="text-xs text-slate-500 leading-none">Gestión Procesal</span>
            </div>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ id, label, icon: Icon, path }) => (
              <button
                key={id}
                id={`nav-${id}`}
                onClick={() => onNavigate(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
                  ${activePage === id
                    ? 'bg-navy-700/60 text-white border border-navy-500/40 shadow-glow-blue'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>

          {/* Estado API + menú móvil */}
          <div className="flex items-center gap-3">
            {/* Indicador de estado de la API */}
            <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border
              ${apiOnline
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}>
              {apiOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
              {apiOnline ? 'API Conectada' : 'API Desconectada'}
            </div>

            {/* Hamburger (móvil) */}
            <button
              className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/10 px-4 py-3 space-y-1 animate-fade-in">
          {navLinks.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { onNavigate(id); setMenuOpen(false); }}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all
                ${activePage === id
                  ? 'bg-navy-700/60 text-white border border-navy-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}
