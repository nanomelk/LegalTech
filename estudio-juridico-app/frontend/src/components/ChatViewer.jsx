/**
 * ChatViewer.jsx – Módulo de Visualización de Chats (n8n + MongoDB).
 * Maquetación estilo Telegram / WhatsApp Web adaptada a la estética LexTrack.
 */
import { useState, useEffect, useRef, useMemo } from 'react';
import {
  MessageSquare,
  Bot,
  User,
  Search,
  RefreshCw,
  Clock,
  CheckCheck,
  AlertCircle,
  Phone,
  Copy,
  Check,
  ArrowLeft,
  ShieldCheck,
  Hash,
  Database,
  Info,
} from 'lucide-react';
import { getChats, getChatSession } from '../services/api';

export default function ChatViewer() {
  // Estados de datos
  const [chats, setChats] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [messages, setMessages] = useState([]);

  // Estados de carga y error
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [errorChats, setErrorChats] = useState(null);
  const [errorMessages, setErrorMessages] = useState(null);

  // Filtro y UI
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState(false);
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'chat'

  // Referencias para auto-scroll
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // -------------------------------------------------------------------------
  // Cargar listado de chats
  // -------------------------------------------------------------------------
  const cargarChats = async (mantenerSeleccion = true) => {
    setLoadingChats(true);
    setErrorChats(null);
    try {
      const data = await getChats();
      const list = data.chats || [];
      setChats(list);

      // Si no hay chat seleccionado y hay chats disponibles en pantalla grande, seleccionamos el primero
      if (!mantenerSeleccion || (!selectedSessionId && list.length > 0 && window.innerWidth >= 768)) {
        if (list.length > 0) {
          seleccionarChat(list[0].sessionId);
        }
      }
    } catch (err) {
      console.error('Error al cargar chats:', err);
      setErrorChats(
        err.mensaje ||
        'No se pudo conectar con el servidor de MongoDB. Verifica la conexión y la colección "chat_histories".'
      );
    } finally {
      setLoadingChats(false);
    }
  };

  useEffect(() => {
    cargarChats(false);
  }, []);

  // -------------------------------------------------------------------------
  // Cargar mensajes de una sesión seleccionada
  // -------------------------------------------------------------------------
  const cargarMensajes = async (sessionId) => {
    if (!sessionId) return;
    setLoadingMessages(true);
    setErrorMessages(null);
    try {
      const data = await getChatSession(sessionId);
      setMessages(Array.isArray(data) ? data : (data.messages || []));
    } catch (err) {
      console.error(`Error al cargar mensajes de ${sessionId}:`, err);
      setErrorMessages(
        err.mensaje || 'Error al obtener los mensajes de la sesión desde MongoDB.'
      );
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const seleccionarChat = (sessionId) => {
    setSelectedSessionId(sessionId);
    setMobileView('chat');
    cargarMensajes(sessionId);
  };

  // -------------------------------------------------------------------------
  // Auto-scroll al último mensaje
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loadingMessages]);

  // -------------------------------------------------------------------------
  // Copiar sessionId al portapapeles
  // -------------------------------------------------------------------------
  const handleCopySessionId = (id) => {
    if (!id) return;
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // -------------------------------------------------------------------------
  // Filtrado de chats por término de búsqueda
  // -------------------------------------------------------------------------
  const chatsFiltrados = useMemo(() => {
    if (!searchTerm.trim()) return chats;
    const term = searchTerm.toLowerCase();
    return chats.filter((c) => {
      const idMatch = c.sessionId && c.sessionId.toLowerCase().includes(term);
      const msgMatch = c.last_message && c.last_message.toLowerCase().includes(term);
      return idMatch || msgMatch;
    });
  }, [chats, searchTerm]);

  // Formato amigable de identificador (si parece teléfono o UUID)
  const formatearIdSesion = (id) => {
    if (!id) return 'Desconocido';
    if (/^\+?\d{8,15}$/.test(id)) {
      return id.startsWith('+') ? id : `+${id}`;
    }
    return id;
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Cabecera del módulo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-navy-700/60 border border-navy-500/40 text-gold-400 shadow-glow-blue">
              <MessageSquare size={20} />
            </span>
            <h1 className="text-2xl font-serif font-bold text-white tracking-wide">
              Visualización de Chats
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Historial de interacciones de clientes y asistente IA sincronizados desde{' '}
            <span className="text-navy-300 font-mono text-xs px-1.5 py-0.5 rounded bg-navy-900/60 border border-navy-700/50">
              MongoDB / chat_histories
            </span>
          </p>
        </div>

        {/* Acciones globales */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-navy-900/60 border border-navy-700/40 text-xs text-slate-300">
            <Database size={14} className="text-emerald-400" />
            <span>Colección: <strong className="text-white">chat_histories</strong></span>
          </div>

          <button
            onClick={() => {
              cargarChats(true);
              if (selectedSessionId) cargarMensajes(selectedSessionId);
            }}
            disabled={loadingChats || loadingMessages}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                       bg-navy-700/50 hover:bg-navy-600/60 text-slate-200 hover:text-white
                       border border-navy-500/30 hover:border-navy-400/50
                       transition-all duration-200 active:scale-95 disabled:opacity-50"
            title="Refrescar datos"
          >
            <RefreshCw
              size={15}
              className={`${loadingChats || loadingMessages ? 'animate-spin text-gold-400' : 'text-slate-400'}`}
            />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Contenedor principal estilo Telegram / WhatsApp */}
      <div className="bg-slate-900/80 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-xl overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[600px] max-h-[750px] h-[calc(100vh-13rem)]">

        {/* =================================================================== */}
        {/* PANEL IZQUIERDO: Lista de Conversaciones (Sidebar)                  */}
        {/* =================================================================== */}
        <div
          className={`md:col-span-4 lg:col-span-4 flex flex-col border-r border-white/10 bg-slate-950/70 h-full min-h-0 ${mobileView === 'chat' ? 'hidden md:flex' : 'flex'
            }`}
        >
          {/* Barra de búsqueda de contactos */}
          <div className="p-3.5 border-b border-white/10 bg-slate-900/50 flex-shrink-0">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar sesión o mensaje..."
                className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl
                           bg-slate-850/90 text-slate-200 placeholder-slate-500
                           border border-white/10 focus:border-navy-400 focus:outline-none focus:ring-1 focus:ring-navy-400
                           transition-colors"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
                >
                  &times;
                </button>
              )}
            </div>

            {/* Contador de sesiones */}
            <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-slate-400">
              <span>{chatsFiltrados.length} {chatsFiltrados.length === 1 ? 'contacto' : 'contactos'}</span>
              <span className="text-slate-500">n8n Sessions</span>
            </div>
          </div>

          {/* Listado con scroll */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/5 scrollbar-thin">
            {loadingChats && chats.length === 0 && (
              <div className="p-8 text-center text-slate-400 space-y-3">
                <RefreshCw size={24} className="animate-spin text-navy-400 mx-auto" />
                <p className="text-xs">Consultando sesiones en MongoDB...</p>
              </div>
            )}

            {errorChats && (
              <div className="m-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-semibold text-red-200">
                  <AlertCircle size={14} />
                  <span>Error de conexión</span>
                </div>
                <p className="leading-relaxed">{errorChats}</p>
                <button
                  onClick={() => cargarChats(true)}
                  className="w-full py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-200 font-medium transition-colors"
                >
                  Reintentar
                </button>
              </div>
            )}

            {!loadingChats && !errorChats && chatsFiltrados.length === 0 && (
              <div className="p-8 text-center text-slate-500 space-y-2">
                <MessageSquare size={32} className="mx-auto text-slate-600/70" />
                <p className="text-xs font-medium text-slate-400">
                  {searchTerm ? 'No hay resultados para la búsqueda' : 'No hay chats registrados'}
                </p>
                <p className="text-[11px] text-slate-600 max-w-xs mx-auto">
                  {searchTerm
                    ? 'Intenta con otro número o palabra clave.'
                    : 'Las conversaciones procesadas por n8n aparecerán automáticamente aquí.'}
                </p>
              </div>
            )}

            {chatsFiltrados.map((chat) => {
              const isSelected = chat.sessionId === selectedSessionId;
              const formattedId = formatearIdSesion(chat.sessionId);

              return (
                <button
                  key={chat.sessionId}
                  onClick={() => seleccionarChat(chat.sessionId)}
                  className={`w-full text-left p-3.5 flex items-start gap-3 transition-all duration-200 relative
                    ${isSelected
                      ? 'bg-navy-800/70 border-l-4 border-l-navy-400 shadow-md'
                      : 'hover:bg-white/[0.03] border-l-4 border-l-transparent'
                    }`}
                >
                  <div className={`relative flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm border
                    ${isSelected
                      ? 'bg-gradient-to-br from-navy-500 to-navy-700 border-navy-400/60 text-white shadow-glow-blue'
                      : 'bg-slate-800 border-slate-700/60 text-slate-300'
                    }`}
                  >
                    {chat.sessionId.match(/^\+?\d+$/) ? (
                      <Phone size={18} className={isSelected ? 'text-gold-300' : 'text-slate-400'} />
                    ) : (
                      <User size={18} className={isSelected ? 'text-gold-300' : 'text-slate-400'} />
                    )}
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <h3 className={`text-xs font-semibold truncate ${isSelected ? 'text-white font-mono' : 'text-slate-200 font-mono'
                        }`}>
                        {formattedId}
                      </h3>
                      {chat.updated_at && (
                        <span className="text-[10px] text-slate-500 flex-shrink-0">
                          {new Date(chat.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      {chat.last_sender === 'ai' || chat.last_sender === 'assistant' ? (
                        <Bot size={13} className="text-navy-300 flex-shrink-0" />
                      ) : (
                        <User size={13} className="text-slate-500 flex-shrink-0" />
                      )}
                      <p className="truncate text-[11px] text-slate-400">
                        {chat.last_message || 'Sin mensajes disponibles'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 border border-slate-700/50">
                        <Hash size={10} />
                        {chat.total_messages} {chat.total_messages === 1 ? 'msg' : 'msgs'}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* =================================================================== */}
        {/* PANEL DERECHO: Ventana de Conversación (Chat Window)                 */}
        {/* =================================================================== */}
        <div
          className={`md:col-span-8 lg:col-span-8 flex flex-col bg-slate-950/40 relative h-full min-h-0 ${mobileView === 'list' ? 'hidden md:flex' : 'flex'
            }`}
        >
          {selectedSessionId ? (
            <>
              {/* Cabecera del chat seleccionado */}
              <div className="p-3.5 px-4 border-b border-white/10 bg-slate-900/70 backdrop-blur-md flex items-center justify-between gap-3 flex-shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => setMobileView('list')}
                    className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <ArrowLeft size={18} />
                  </button>

                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-navy-700 to-navy-500 border border-navy-400/40 flex items-center justify-center text-gold-300 shadow-glow-blue flex-shrink-0">
                    <User size={20} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-white font-mono truncate">
                        {formatearIdSesion(selectedSessionId)}
                      </h2>
                      <button
                        onClick={() => handleCopySessionId(selectedSessionId)}
                        className="p-1 rounded text-slate-400 hover:text-gold-300 hover:bg-white/5 transition-colors"
                        title="Copiar ID de sesión"
                      >
                        {copiedId ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-emerald-400 font-medium">Historial n8n activo</span>
                      <span className="text-slate-600">&bull;</span>
                      <span>{messages.length} mensajes</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => cargarMensajes(selectedSessionId)}
                    disabled={loadingMessages}
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors"
                    title="Recargar conversación"
                  >
                    <RefreshCw
                      size={16}
                      className={loadingMessages ? 'animate-spin text-gold-400' : ''}
                    />
                  </button>
                </div>
              </div>

              {/* Área de mensajes con scroll independiente */}
              <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin bg-gradient-to-b from-slate-950/60 via-slate-900/30 to-slate-950/60"
              >
                {loadingMessages && (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-3">
                    <RefreshCw size={28} className="animate-spin text-navy-400" />
                    <p className="text-xs">Cargando mensajes del historial...</p>
                  </div>
                )}

                {errorMessages && !loadingMessages && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs space-y-2 max-w-md mx-auto">
                    <div className="flex items-center gap-1.5 font-semibold text-red-200">
                      <AlertCircle size={15} />
                      <span>No se pudieron cargar los mensajes</span>
                    </div>
                    <p>{errorMessages}</p>
                    <button
                      onClick={() => cargarMensajes(selectedSessionId)}
                      className="px-3 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-200 font-medium transition-colors"
                    >
                      Reintentar
                    </button>
                  </div>
                )}

                {!loadingMessages && !errorMessages && messages.length === 0 && (
                  <div className="text-center py-16 text-slate-500 space-y-2">
                    <MessageSquare size={36} className="mx-auto text-slate-600/70" />
                    <p className="text-sm font-medium text-slate-400">Esta sesión aún no contiene mensajes</p>
                    <p className="text-xs text-slate-600 max-w-sm mx-auto">
                      El array `History` en MongoDB para este `sessionId` se encuentra vacío.
                    </p>
                  </div>
                )}

                {/* Renderizado de mensajes formateados estilo Telegram */}
                {!loadingMessages &&
                  messages.map((msg, idx) => {
                    // Normalización para detectar si el emisor es la IA o el cliente
                    const senderType = (msg.sender || msg.type || '').toLowerCase();
                    const isAi = senderType === 'ai' || senderType === 'assistant';

                    return (
                      <div
                        key={idx}
                        className={`flex flex-col ${isAi ? 'items-end' : 'items-start'} transition-all animate-fade-in`}
                      >
                        {/* Etiqueta del emisor sobre la burbuja */}
                        <div className={`flex items-center gap-1.5 mb-1 px-1 text-[11px] font-medium ${isAi ? 'text-navy-300' : 'text-slate-400'
                          }`}>
                          {isAi ? (
                            <>
                              <span>Asistente IA (LexBot)</span>
                              <Bot size={13} className="text-cyan-400" />
                            </>
                          ) : (
                            <>
                              <User size={13} className="text-gold-400" />
                              <span>Cliente ({formatearIdSesion(selectedSessionId)})</span>
                            </>
                          )}
                        </div>

                        {/* Burbuja del mensaje (IA = Derecha/Azul | Cliente = Izquierda/Gris) */}
                        <div
                          className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm leading-relaxed shadow-lg backdrop-blur-sm ${isAi
                              ? 'bg-gradient-to-br from-navy-600 via-navy-700 to-navy-800 text-white rounded-tr-none border border-navy-400/40 shadow-glow-blue'
                              : 'bg-slate-800/90 text-slate-100 rounded-tl-none border border-slate-700/70 shadow-md'
                            }`}
                        >
                          <div className="whitespace-pre-wrap break-words">
                            {msg.text || (typeof msg.data === 'object' ? msg.data.content : '')}
                          </div>

                          <div
                            className={`flex items-center justify-end gap-1 mt-2 text-[10px] ${isAi ? 'text-navy-200/80' : 'text-slate-400'
                              }`}
                          >
                            {msg.timestamp && (
                              <span className="flex items-center gap-1">
                                <Clock size={10} />
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                            {isAi && (
                              <CheckCheck size={13} className="text-cyan-300 ml-1" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                <div ref={messagesEndRef} />
              </div>

              {/* Barra informativa inferior */}
              <div className="p-3 px-4 border-t border-white/10 bg-slate-900/60 backdrop-blur-md flex items-center justify-between text-xs text-slate-400 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={15} className="text-gold-400" />
                  <span className="text-[11px]">
                    Visualización de solo lectura del historial persistido por n8n
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
                  {messages.length} mensajes sincronizados
                </span>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-navy-800 to-navy-950 border border-navy-500/30 flex items-center justify-center shadow-glow-blue">
                  <MessageSquare size={36} className="text-gold-400" />
                </div>
                <div className="absolute -bottom-1 -right-1 p-1.5 rounded-lg bg-slate-900 border border-navy-400/40 text-cyan-400">
                  <Bot size={16} />
                </div>
              </div>

              <div className="max-w-md space-y-1.5">
                <h2 className="text-lg font-serif font-bold text-white">
                  Selecciona una conversación
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Elige un contacto del panel izquierdo para inspeccionar en tiempo real el historial
                  completo de mensajes entre el cliente y el asistente virtual alimentado por n8n.
                </p>
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] text-slate-400">
                <Info size={12} className="text-gold-400" />
                <span>Compatible con colecciones MongoDB 'chat_histories'</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}