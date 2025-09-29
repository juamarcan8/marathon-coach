import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import './Generating.css';
import { useLocation, useNavigate } from 'react-router-dom';
import { OrbitProgress } from 'react-loading-indicators';

export default function Generating(){
  const location = useLocation();
  const navigate = useNavigate();

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const initialPayload = location.state || JSON.parse(localStorage.getItem('pending_plan_payload') || 'null');

  // ref para evitar setState después de desmontar
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!initialPayload) {
      setMessage('No hay datos para generar el plan. Vuelve al wizard.');
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const source = axios.CancelToken.source ? axios.CancelToken.source() : null;

    const generate = async () => {
      try {
        console.log('[Generating] enviando payload:', initialPayload);
        const res = await axios.post(
          'https://marathon-coach-backend-1.onrender.com/api/generate-plan',
          initialPayload,
          {
            timeout: 1000000   ,
            signal: controller.signal, // usa signal cuando axios lo soporte en tu versión
            cancelToken: source ? source.token : undefined,
            headers: { 'Content-Type': 'application/json' }
          }
        );

        console.log('[Generating] respuesta completa:', res);
        let generatedPlan = null;

        // <- CORRECION: usa && en vez de & (bitwise)
        if (res?.data?.success && res?.data?.data) {
          generatedPlan = res.data.data;
        } else if (res?.data) {
          // si el servidor devolvió el plan directamente (schema distinto)
          generatedPlan = res.data;
        } else {
          const txt = await (res?.text ? res.text() : Promise.resolve(null));
          console.error('[Generating] respuesta inesperada:', txt || res);
          setError('Respuesta inesperada del servidor');
          setLoading(false);
          return;
        }

        // log para verificar plan recibido
        console.log('[Generating] plan generado (preview):', 
          typeof generatedPlan === 'object' ? JSON.stringify(generatedPlan).slice(0, 2000) : String(generatedPlan)
        );

        // si quieres redirigir solo cuando hay plan
        if (generatedPlan) {
          // pasar plan por state (o usar planId si prefieres)
          if (mountedRef.current) {
            setLoading(false);
            navigate('/plan', { state: { plan: generatedPlan } });
          }
        } else {
          if (mountedRef.current) {
            setError('No se generó un plan válido');
            setLoading(false);
          }
        }

      } catch (err) {
        console.error('[Generating] error en request:', err);

        // axios error object handling
        let msg = 'Error generando el plan';
        if (axios.isCancel && axios.isCancel(err)) {
          msg = 'Petición cancelada';
        } else if (err?.response) {
          // el servidor respondió con 4xx/5xx
          console.error('[Generating] error.response.data:', err.response.data);
          msg = `Servidor: ${err.response.status} - ${JSON.stringify(err.response.data).slice(0,500)}`;
        } else if (err?.request) {
          // se envió la petición pero no hubo respuesta
          console.error('[Generating] no hubo respuesta (request):', err.request);
          msg = 'No hubo respuesta del servidor (timeout o conexión).';
        } else {
          // otro error
          msg = err.message || String(err);
        }

        if (mountedRef.current) {
          setError(msg);
          setLoading(false);
        }
      }
    };

    generate();

    return () => {
      // cancelar la petición si desmontan el componente
      try {
        controller.abort && controller.abort();
      } catch (e) {}
      try {
        source && source.cancel && source.cancel('Component unmounted');
      } catch (e) {}
    };
  }, [initialPayload, navigate]);

  return (
    <main className="generating-wrap" aria-live="polite">
      <div className="generating-card" role="status" aria-busy={loading}>
        <div className="generating-center">
          {loading ? (
            <div className="spinner-row">
              <OrbitProgress color="#318ccc" size="medium" text="" textColor="" />
              <p className="generating-text">Generando tu plan... esto puede tardar unos segundos minutos</p>
            </div>
          ) : error ? (
            <div className="status-block">
              <p className="generating-error">✖ {error}</p>
              <button className="btn ghost small" onClick={() => navigate('/newTraining')}>Volver al formulario</button>
            </div>
          ) : (
            <div className="status-block">
              <p className="generating-ok">✔ Plan generado correctamente</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};
