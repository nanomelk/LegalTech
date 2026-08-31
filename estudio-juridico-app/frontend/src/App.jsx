/**
 * App.jsx – Raíz de la aplicación LexTrack.
 * Gestiona la navegación entre páginas (Casos / Ingesta) y el estado global.
 */
import { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import CasosTable from './components/CasosTable';
import IngestaForm from './components/IngestaForm';
import { getCasos } from './services/api';

export default function App() {
  const [pagina, setPagina]       = useState('casos');
  const [casos, setCasos]         = useState([]);
  const [loading, setLoading]     = useState(false);
  const [apiOnline, setApiOnline] = useState(true);

  const cargarCasos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCasos();
      setCasos(data.casos || []);
      setApiOnline(true);
    } catch {
      setApiOnline(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Carga inicial
  useEffect(() => {
    cargarCasos();
  }, [cargarCasos]);

  function handleIngestaExito(nuevoCaso, irACasos = false) {
    if (irACasos) {
      setPagina('casos');
      cargarCasos();
    }
  }

  function handleNavigate(destino) {
    setPagina(destino);
    if (destino === 'casos') cargarCasos();
  }

  return (
    <div className="min-h-screen">
      <Navbar
        activePage={pagina}
        onNavigate={handleNavigate}
        apiOnline={apiOnline}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {pagina === 'casos' && (
          <CasosTable
            casos={casos}
            loading={loading}
            onRefresh={cargarCasos}
          />
        )}
        {pagina === 'ingesta' && (
          <IngestaForm onExito={handleIngestaExito} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 mt-16 py-6 text-center text-xs text-slate-600">
        LexTrack – Sistema de Gestión Procesal &copy; {new Date().getFullYear()} &middot; Estudio Jurídico
      </footer>
    </div>
  );
}
