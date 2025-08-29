// src/pages/Myplan.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Myplan.css';
import { useNavigate } from 'react-router-dom';

export default function Myplan() {
  const [workout, setWorkout] = useState(null); // próximo entrenamiento (objeto)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const getNextWorkout = async () => {
      setLoading(true);
      console.log(loading);
      setError('');
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          // si no hay token, redirige al login (o muestra mensaje)
          setError('No autenticado. Inicia sesión por favor.');
          setLoading(false);
          navigate('/login');
          return;
        }

        const res = await axios.get('http://localhost:4000/api/next-workout', {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Respuesta flexible: puede devolver el objeto directamente o { workout: ... } u { data: ... }
        let data = res.data;
        // si tu backend devuelve { success: true, data: {...} } adapta aquí
        if (data?.workout) data = data.workout;
        if (data?.data) data = data.data;

        // si viene un array, tomar el primero
        if (Array.isArray(data)) {
          setWorkout(data[0] ?? null);
        } else {
          setWorkout(data ?? null);
        }
      } catch (err) {
        console.error(err);
        const msg = err.response?.data?.error || err.message || 'Error obteniendo próximo entrenamiento';
        setError(String(msg));
      } finally {
        console.log(workout);
        setLoading(false);
        console.log(loading);
      }
    };

    getNextWorkout();
    // solo una llamada al montar
  }, []);

  // Handler de ejemplo para marcar completado (debes implementar endpoint)
  const markDone = async () => {
    if (!workout) return;
    const token = localStorage.getItem('token');
    try {
      // await axios.post(`http://localhost:4000/api/workouts/${workout.id}/complete`, {}, {
      //   headers: { Authorization: `Bearer ${token}` }
      // });
      // refetch o eliminar localmente
      setWorkout(null);
    } catch (err) {
      console.error('Error marcando como hecho', err);
    }
  };

  return (
    <main className="plan-page">
      <div className="plan-wrapper">
        <h1 className="page-title">Próximo entrenamiento</h1>
        {loading ? (
          <div className="card loading">
            <div className="spinner" aria-hidden />
            <div className="loading-text">Cargando próximo entrenamiento…</div>
          </div>
        ) : error ? (
          <div className="card empty">
            <p className="muted">{error}</p>
          </div>
        ) : !workout ? (
          <div className="card empty">
            <p className="muted">No se ha encontrado el próximo entrenamiento.</p>
          </div>
        ) : (
      
          <article className="card workout-card"  aria-label="Próximo entrenamiento" onClick={() => navigate('/training-details', { state: { workout } })} >
            <header className="workout-header">
              <div>
                <div className="day">{workout.day || formatDateToDay(workout.date)}</div>
                <div className="date">{workout.date}</div>
              </div>
              <div className="badge">{workout.type || 'Entreno'}</div>
            </header>

            <section className="workout-body">
              <div className="row metrics">
                <div className="metric">
                  <div className="metric-label">Distancia</div>
                  <div className="metric-value">{workout.distance_km ?? '—'} km</div>
                </div>
                <div className="metric">
                  <div className="metric-label">Ritmo</div>
                  <div className="metric-value">{workout.pace_min_km ?? workout.pace_text ?? '—'}</div>
                </div>
              </div>

              <div className="description">
                <h4>Instrucciones</h4>
                <p>{workout.description || workout.notes || 'Sin detalles'}</p>
              </div>

              <div className="advice">
                <strong>Consejo</strong>
                <p>{workout.advice || 'Sin consejos'}</p>
              </div>
            </section>

            <footer className="workout-footer">
              <button className="btn primary" onClick={() => navigate('/training-details', { state: { workout } })}>
                Ver detalles
              </button>
              <button className="btn ghost" onClick={markDone}>Marcar completado</button>
            </footer>
          </article>
        )}
      </div>
    </main>
  );
}

/* small helper para mostrar día si no viene */
function formatDateToDay(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString(undefined, { weekday: 'long' });
  } catch {
    return '';
  }
}
