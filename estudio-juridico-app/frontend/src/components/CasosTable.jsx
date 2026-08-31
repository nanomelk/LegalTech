/**
 * CasosTable.jsx – Tabla de expedientes judiciales con semáforo visual RF-01.
 *
 * RF-01 (Semáforo de vencimientos):
 *   🔴 Rojo    → vence en ≤ 3 días
 *   🟡 Amarillo → vence en ≤ 7 días
 *   🟢 Verde    → vence en > 7 días
 */
import { useState, useMemo } from 'react';
import {
  RefreshCw, Search, ExternalLink, AlertTriangle,
  Clock, CheckCircle, FileText, Filter, ChevronUp, ChevronDown
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Helpers de semáforo
// ---------------------------------------------------------------------------
function diasHastaVencimiento(fechaISO) {
  if (!fechaISO) return Infinity;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const vencimiento = new Date(fechaISO + 'T00:00:00');
  return Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24));
}

function getSemaforo(dias) {
  if (dias <= 3)  return { clase: 'semaforo-rojo',     icono: AlertTriangle, label: `${dias}d`,  emoji: '🔴' };
  if (dias <= 7)  return { clase: 'semaforo-amarillo', icono: Clock,         label: `${dias}d`,  emoji: '🟡' };
  return           { clase: 'semaforo-verde',    icono: CheckCircle,   label: `${dias}d`,  emoji: '🟢' };
}

function formatFecha(fechaISO) {
  if (!fechaISO) return '—';
  const [y, m, d] = fechaISO.split('-');
  return `${d}/${m}/${y}`;
}

// ---------------------------------------------------------------------------
// Badge de estado
// ---------------------------------------------------------------------------
const ESTADO_ESTILOS = {
  'Ingesta Recibida':        'bg-blue-500/20 border-blue-500/40 text-blue-300',
  'Pendiente Documentación': 'bg-amber-500/20 border-amber-500/40 text-amber-300',
  'En Revisión':             'bg-purple-500/20 border-purple-500/40 text-purple-300',
  'Ficha Completada':        'bg-emerald-500/20 border-emerald-500/40 text-emerald-300',
};

function EstadoBadge({ estado }) {
  const estilos = ESTADO_ESTILOS[estado] || 'bg-slate-500/20 border-slate-500/40 text-slate-300';
  return (
    <span className={`badge ${estilos}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {estado || 'Sin Estado'}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------
export default function CasosTable({ casos = [], loading = false, onRefresh }) {
  const [busqueda, setBusqueda] = useState('');
  const [filtroFuero, setFiltroFuero] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'fecha_vencimiento', dir: 'asc' });

  // Fueros únicos para el filtro
  const fueros = useMemo(() => (
    [...new Set(casos.map(c => c.fuero).filter(Boolean))]
  ), [casos]);

  // Filtrado + búsqueda
  const casosFiltrados = useMemo(() => {
    return casos.filter(c => {
      const matchBusqueda = !busqueda || [c.id_caso, c.caratula, c.nro_expediente, c.nombre_cliente]
        .some(v => v?.toLowerCase().includes(busqueda.toLowerCase()));
      const matchFuero = !filtroFuero || c.fuero === filtroFuero;
      return matchBusqueda && matchFuero;
    });
  }, [casos, busqueda, filtroFuero]);

  // Ordenamiento
  const casosOrdenados = useMemo(() => {
    return [...casosFiltrados].sort((a, b) => {
      const va = a[sortConfig.key] ?? '';
      const vb = b[sortConfig.key] ?? '';
      return sortConfig.dir === 'asc'
        ? String(va).localeCompare(String(vb))
        : String(vb).localeCompare(String(va));
    });
  }, [casosFiltrados, sortConfig]);

  function toggleSort(key) {
    setSortConfig(prev =>
      prev.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: 'asc' }
    );
  }

  function SortIcon({ campo }) {
    if (sortConfig.key !== campo) return <ChevronUp size={12} className="text-slate-600" />;
    return sortConfig.dir === 'asc'
      ? <ChevronUp size={12} className="text-navy-400" />
      : <ChevronDown size={12} className="text-navy-400" />;
  }

  // Stats para el resumen superior
  const stats = useMemo(() => ({
    total: casos.length,
    criticos: casos.filter(c => diasHastaVencimiento(c.fecha_vencimiento) <= 3).length,
    urgentes: casos.filter(c => {
      const d = diasHastaVencimiento(c.fecha_vencimiento);
      return d > 3 && d <= 7;
    }).length,
  }), [casos]);

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-white">Expedientes Judiciales</h1>
          <p className="text-slate-400 text-sm mt-1">
            {stats.total} caso{stats.total !== 1 ? 's' : ''} registrado{stats.total !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          id="btn-refrescar-casos"
          onClick={onRefresh}
          disabled={loading}
          className="btn-secondary self-start sm:self-auto"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-bold text-white">{stats.total}</div>
          <div className="text-xs text-slate-400 mt-1">Total Casos</div>
        </div>
        <div className="glass-card p-4 text-center border-red-500/20">
          <div className="text-2xl font-bold text-red-400">{stats.criticos}</div>
          <div className="text-xs text-slate-400 mt-1">Críticos (≤3d)</div>
        </div>
        <div className="glass-card p-4 text-center border-amber-500/20">
          <div className="text-2xl font-bold text-amber-400">{stats.urgentes}</div>
          <div className="text-xs text-slate-400 mt-1">Urgentes (≤7d)</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            id="busqueda-casos"
            type="text"
            placeholder="Buscar por ID, carátula, expediente, cliente..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="input-field pl-9"
          />
        </div>
        <div className="relative sm:w-48">
          <Filter size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <select
            id="filtro-fuero"
            value={filtroFuero}
            onChange={e => setFiltroFuero(e.target.value)}
            className="input-field pl-9 appearance-none cursor-pointer"
          >
            <option value="">Todos los fueros</option>
            {fueros.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-500">
            <RefreshCw size={24} className="animate-spin mr-3" />
            Cargando expedientes...
          </div>
        ) : casosOrdenados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-3">
            <FileText size={40} className="text-slate-700" />
            <p className="text-sm">No se encontraron expedientes.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full tabla-legal">
              <thead>
                <tr>
                  {[
                    { key: 'id_caso',           label: 'ID Caso' },
                    { key: 'caratula',           label: 'Carátula' },
                    { key: 'fuero',              label: 'Fuero' },
                    { key: 'nro_expediente',     label: 'Nº Expediente' },
                    { key: 'fecha_vencimiento',  label: 'Vencimiento' },
                    { key: 'tipo_plazo',         label: 'Tipo Plazo' },
                    { key: 'estado_tramite',     label: 'Estado' },
                    { key: null,                 label: 'Evidencia' },
                  ].map(({ key, label }) => (
                    <th key={label}>
                      {key ? (
                        <button
                          onClick={() => toggleSort(key)}
                          className="flex items-center gap-1 hover:text-slate-200 transition-colors"
                        >
                          {label}
                          <SortIcon campo={key} />
                        </button>
                      ) : label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {casosOrdenados.map((caso) => {
                  const dias = diasHastaVencimiento(caso.fecha_vencimiento);
                  const { clase, icono: IconoSemaforo, label: labelDias, emoji } = getSemaforo(dias);
                  return (
                    <tr key={caso.id_caso} className="group">
                      {/* ID */}
                      <td>
                        <span className="font-mono text-xs font-semibold text-navy-300 bg-navy-900/50 px-2 py-1 rounded-lg">
                          {caso.id_caso}
                        </span>
                      </td>

                      {/* Carátula */}
                      <td className="max-w-xs">
                        <div className="font-medium text-slate-200 truncate" title={caso.caratula}>
                          {caso.caratula || '—'}
                        </div>
                        {caso.nombre_cliente && (
                          <div className="text-xs text-slate-500 truncate">{caso.nombre_cliente}</div>
                        )}
                      </td>

                      {/* Fuero */}
                      <td>
                        <span className="text-slate-300 text-xs bg-white/5 px-2 py-1 rounded-lg border border-white/10">
                          {caso.fuero || '—'}
                        </span>
                      </td>

                      {/* Nº Expediente */}
                      <td className="font-mono text-xs text-slate-400">
                        {caso.nro_expediente || '—'}
                      </td>

                      {/* Vencimiento + Semáforo RF-01 */}
                      <td>
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border ${clase}`}>
                          <IconoSemaforo size={12} />
                          <span>{formatFecha(caso.fecha_vencimiento)}</span>
                          <span className="opacity-75">({isFinite(dias) ? labelDias : '∞'})</span>
                        </div>
                      </td>

                      {/* Tipo Plazo */}
                      <td className="text-slate-400 text-xs">{caso.tipo_plazo || '—'}</td>

                      {/* Estado */}
                      <td><EstadoBadge estado={caso.estado_tramite} /></td>

                      {/* Evidencia */}
                      <td>
                        {caso.link_evidencia ? (
                          <a
                            href={caso.link_evidencia}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-navy-400 hover:text-navy-300 text-xs
                                       hover:underline transition-colors"
                          >
                            <ExternalLink size={12} />
                            Ver Drive
                          </a>
                        ) : (
                          <span className="text-slate-600 text-xs">Sin adjunto</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Leyenda semáforo */}
      <div className="flex flex-wrap gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" /> Crítico: vence en ≤ 3 días</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> Urgente: vence en ≤ 7 días</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Normal: vence en &gt; 7 días</span>
      </div>
    </div>
  );
}
