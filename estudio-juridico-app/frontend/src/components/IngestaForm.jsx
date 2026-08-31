/**
 * IngestaForm.jsx – Formulario de carga manual de datos recibidos por WhatsApp.
 * Implementa el modelo RD-02 (IngestaCreate) y lo envía al endpoint POST /api/v1/ingesta.
 */
import { useState } from 'react';
import {
  User, CreditCard, MapPin, FileText, Link2,
  Send, CheckCircle, AlertCircle, Loader2, RotateCcw
} from 'lucide-react';
import { crearIngesta } from '../services/api';

const CAMPO_INICIAL = {
  nombre_completo: '',
  dni: '',
  domicilio_real: '',
  resumen_hecho: '',
  link_evidencia_drive: '',
};

const campos = [
  {
    key: 'nombre_completo',
    label: 'Nombre Completo del Cliente',
    placeholder: 'Ej: Juan Carlos Pérez',
    icon: User,
    tipo: 'text',
    required: true,
    ancho: 'col-span-2 sm:col-span-1',
  },
  {
    key: 'dni',
    label: 'DNI / Documento de Identidad',
    placeholder: 'Ej: 28456789',
    icon: CreditCard,
    tipo: 'text',
    required: true,
    ancho: 'col-span-2 sm:col-span-1',
  },
  {
    key: 'domicilio_real',
    label: 'Domicilio Real',
    placeholder: 'Ej: Av. Corrientes 1234, CABA',
    icon: MapPin,
    tipo: 'text',
    required: true,
    ancho: 'col-span-2',
  },
  {
    key: 'resumen_hecho',
    label: 'Resumen del Hecho',
    placeholder: 'Describe brevemente el hecho o situación jurídica del cliente...',
    icon: FileText,
    tipo: 'textarea',
    required: true,
    ancho: 'col-span-2',
  },
  {
    key: 'link_evidencia_drive',
    label: 'Link de Evidencia (Google Drive)',
    placeholder: 'https://drive.google.com/drive/folders/...',
    icon: Link2,
    tipo: 'url',
    required: false,
    ancho: 'col-span-2',
  },
];

export default function IngestaForm({ onExito }) {
  const [form, setForm]         = useState(CAMPO_INICIAL);
  const [errores, setErrores]   = useState({});
  const [estado, setEstado]     = useState('idle'); // idle | loading | success | error
  const [respuesta, setRespuesta] = useState(null);
  const [msgError, setMsgError]   = useState('');

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errores[name]) setErrores(prev => ({ ...prev, [name]: '' }));
  }

  function validar() {
    const nuevosErrores = {};
    if (!form.nombre_completo.trim()) nuevosErrores.nombre_completo = 'Campo requerido';
    if (!form.dni.trim()) nuevosErrores.dni = 'Campo requerido';
    if (!form.domicilio_real.trim()) nuevosErrores.domicilio_real = 'Campo requerido';
    if (!form.resumen_hecho.trim()) nuevosErrores.resumen_hecho = 'Campo requerido';
    if (form.link_evidencia_drive && !form.link_evidencia_drive.startsWith('http')) {
      nuevosErrores.link_evidencia_drive = 'Debe ser una URL válida (http/https)';
    }
    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validar()) return;

    setEstado('loading');
    try {
      const data = await crearIngesta(form);
      setRespuesta(data);
      setEstado('success');
      if (onExito) onExito(data);
    } catch (err) {
      setMsgError(err.mensaje || 'Error al conectar con el servidor. Verificá que el backend esté activo.');
      setEstado('error');
    }
  }

  function resetear() {
    setForm(CAMPO_INICIAL);
    setErrores({});
    setEstado('idle');
    setRespuesta(null);
    setMsgError('');
  }

  // ── Pantalla de éxito ─────────────────────────────────────────────────────
  if (estado === 'success' && respuesta) {
    return (
      <div className="animate-slide-up">
        <div className="glass-card p-8 text-center max-w-lg mx-auto">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40
                            flex items-center justify-center">
              <CheckCircle size={32} className="text-emerald-400" />
            </div>
          </div>
          <h2 className="font-serif text-2xl font-bold text-white mb-2">¡Ingesta Registrada!</h2>
          <p className="text-slate-400 text-sm mb-6">
            El caso fue creado correctamente en Google Sheets.
          </p>

          <div className="bg-white/5 rounded-xl border border-white/10 p-4 text-left space-y-2 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">ID Caso:</span>
              <span className="font-mono font-bold text-navy-300">{respuesta.id_caso}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Cliente:</span>
              <span className="text-slate-200">{respuesta.nombre_cliente}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Estado:</span>
              <span className="text-blue-300">{respuesta.estado_tramite}</span>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <button id="btn-nueva-ingesta" onClick={resetear} className="btn-primary">
              <RotateCcw size={15} />
              Nueva Ingesta
            </button>
            <button id="btn-ver-expedientes" onClick={() => onExito && onExito(respuesta, true)} className="btn-secondary">
              Ver Expedientes
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Formulario ────────────────────────────────────────────────────────────
  return (
    <div className="animate-slide-up max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-bold text-white">Nueva Ingesta de Caso</h1>
        <p className="text-slate-400 text-sm mt-1">
          Completá los datos mínimos recibidos por WhatsApp o formulario externo (RD-02).
        </p>
      </div>

      {estado === 'error' && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 mb-6 animate-fade-in">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">Error al registrar la ingesta</p>
            <p className="text-xs mt-1 text-red-400">{msgError}</p>
          </div>
        </div>
      )}

      <form id="form-ingesta" onSubmit={handleSubmit} noValidate>
        <div className="glass-card p-6 sm:p-8">
          <div className="grid grid-cols-2 gap-5">
            {campos.map(({ key, label, placeholder, icon: Icono, tipo, required, ancho }) => (
              <div key={key} className={ancho}>
                <label htmlFor={`campo-${key}`} className="input-label">
                  {label} {required && <span className="text-red-400 normal-case font-normal">*</span>}
                </label>
                <div className="relative">
                  <Icono
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                    style={tipo === 'textarea' ? { top: '14px', transform: 'none' } : {}}
                  />
                  {tipo === 'textarea' ? (
                    <textarea
                      id={`campo-${key}`}
                      name={key}
                      value={form[key]}
                      onChange={handleChange}
                      placeholder={placeholder}
                      rows={4}
                      className={`input-field pl-9 resize-none ${errores[key] ? 'border-red-500/60 focus:border-red-500' : ''}`}
                    />
                  ) : (
                    <input
                      id={`campo-${key}`}
                      type={tipo}
                      name={key}
                      value={form[key]}
                      onChange={handleChange}
                      placeholder={placeholder}
                      className={`input-field pl-9 ${errores[key] ? 'border-red-500/60 focus:border-red-500' : ''}`}
                    />
                  )}
                </div>
                {errores[key] && (
                  <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle size={11} />
                    {errores[key]}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-white/10">
            <button
              id="btn-limpiar-form"
              type="button"
              onClick={resetear}
              className="btn-secondary"
            >
              Limpiar
            </button>
            <button
              id="btn-enviar-ingesta"
              type="submit"
              disabled={estado === 'loading'}
              className="btn-primary"
            >
              {estado === 'loading' ? (
                <><Loader2 size={15} className="animate-spin" /> Registrando...</>
              ) : (
                <><Send size={15} /> Registrar Ingesta</>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Info de ayuda */}
      <div className="mt-6 p-4 rounded-xl border border-white/8 bg-white/3 text-xs text-slate-500">
        <p className="font-semibold text-slate-400 mb-1">ℹ️ ¿Cómo funciona?</p>
        <p>
          Al enviar, se genera automáticamente un <strong className="text-slate-300">ID de Caso</strong> (Ej: CASO-042),
          la ficha queda con estado <em className="text-blue-300">"Ingesta Recibida"</em> y
          los datos se persisten en Google Sheets. El abogado completará la ficha procesal completa posteriormente.
        </p>
      </div>
    </div>
  );
}
