// WorkoutDetail.jsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './TrainingDetails.css';

export default function WorkoutDetail() {
  const location = useLocation();
  const navigate = useNavigate();
  const workoutFromState = location.state?.workout || null;

  const [workout, setWorkout] = useState(workoutFromState);
  const [completed, setCompleted] = useState(Boolean(workoutFromState?.completed_at));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  function parseDescription(desc) {
    console.log(desc)
    if (!desc) return [];

    if (Array.isArray(desc)) return desc;

    if (typeof desc === 'object') {
      // Si tiene un campo steps o steps_array o items
      if (Array.isArray(desc.steps)) return desc.steps;
      if (Array.isArray(desc.items)) return desc.items;
      if (desc.text && typeof desc.text === 'string') {
        return [desc.text];
      }
      if (Array.isArray(desc.segments)) return desc.segments.map(s => ({ ...s, __from_segment: true }));
      return [desc];
    }

    // Si es string, dividir en pasos numerados o saltos de línea
    if (typeof desc === 'string') {
      const parts = desc
        .split(/\r?\n|(?<=\.\s)|(?<=\d+\.\s)/)
        .map(s => s.trim())
        .filter(Boolean);
      // si al final el array solo tiene 1 elemento y es muy largo, devolverlo como único string
      return parts.length ? parts : [desc];
    }

    // cualquier otro tipo -> convertir a string
    return [String(desc)];
  }

  // formatea un item objeto tipo segmento/step a JSX legible
  function renderObjectStep(item) {
    // campos frecuentes: text, step, type, reps, distance_km, time_min, pace_min_km, note
    if (typeof item !== 'object' || item === null) return String(item);

    if (item.text || item.step) {
      return item.text || item.step;
    }

    if (item.type) {
      const parts = [];
      parts.push(item.type);
      if (item.reps) parts.push(`${item.reps}x`);
      if (typeof item.distance_km === 'number') parts.push(`${item.distance_km} km`);
      if (item.time_min) parts.push(`${item.time_min} min`);
      if (item.pace_min_km) parts.push(`@ ${item.pace_min_km}`);
      if (item.note) parts.push(`— ${item.note}`);
      return parts.join(' ');
    }

    // Si tiene estructura de segment con time_min_fast/time_min_easy
    if (item.time_min_fast || item.time_min_easy) {
      const fast = item.time_min_fast ? `${item.time_min_fast}min fast` : '';
      const easy = item.time_min_easy ? `${item.time_min_easy}min easy` : '';
      const rep = item.reps ? `${item.reps}x` : '';
      const pace = item.pace_min_km_fast ? `@ ${item.pace_min_km_fast}` : '';
      return [rep, fast, easy, pace].filter(Boolean).join(' ');
    }

    // Fallback: mostrar JSON formateado
    return null;
  }

  useEffect(() => {
    // fallback desde localStorage si no viene por location.state
    if (!workout) {
      const stored = localStorage.getItem('current_workout');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setWorkout(parsed);
          setCompleted(Boolean(parsed?.completed_at));
        } catch (e) {
          console.warn('No se pudo parsear current_workout desde localStorage', e);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (workout) {
      localStorage.setItem('current_workout', JSON.stringify(workout));
    }
  }, [workout]);

  // útil para depuración: ver en consola la estructura recibida
  useEffect(() => {
    if (workout) {
      console.groupCollapsed('[WorkoutDetail] workout debug');
      console.log('workout (obj):', workout);
      try { console.log('workout (json):', JSON.stringify(workout, null, 2)); } catch (e) {}
      const descRaw = workout.description ?? workout.notes ?? workout.description_raw ?? null;
      console.log('raw description:', descRaw);
      const parsed = parseDescription(descRaw);
      console.log('parsed description items:', parsed);
      if (Array.isArray(parsed)) console.table(parsed.map((it, i) => ({ idx: i, type: typeof it, value: (typeof it === 'object' ? JSON.stringify(it) : it) })));
      console.groupEnd();
    }
  }, [workout]);

  async function markCompleted(toggle = true) {
    if (!workout) return;
    setSaving(true);
    setError(null);
    setCompleted(toggle);
    try {
      const token = localStorage.getItem('token');
      if (token) {
        // intenta sincronizar con backend si existe endpoint
        await axios.post('http://localhost:4000/api/mark-workout-complete', { workoutId: workout.id, completed: toggle }, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000
        });
      }
      const next = { ...workout, completed_at: toggle ? new Date().toISOString() : null };
      setWorkout(next);
      localStorage.setItem('current_workout', JSON.stringify(next));
    } catch (e) {
      console.warn('sync failed:', e?.message || e);
      setError('No se pudo sincronizar con el servidor — guardado localmente.');
      // marcar localmente igual
      const next = { ...workout, completed_at: toggle ? new Date().toISOString() : null };
      setWorkout(next);
      localStorage.setItem('current_workout', JSON.stringify(next));
    } finally {
      setSaving(false);
    }
  }

  function downloadJSON() {
    if (!workout) return;
    const blob = new Blob([JSON.stringify(workout, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workout-week${workout.week || 'x'}-${(workout.day || 'workout').toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  if (!workout) {
    return (
      <main className="workout-detail">
        <div className="workout-card">
          <h2 className="workout-title">No hay entrenamiento seleccionado</h2>
          <p className="workout-meta">Selecciona un entrenamiento en la lista o vuelve al plan.</p>
          <div style={{ marginTop: 12 }}>
            <button className="btn" onClick={() => navigate(-1)}>Volver</button>
            <button className="btn ghost" style={{ marginLeft: 8 }} onClick={() => navigate('/plan')}>Ver plan</button>
          </div>
        </div>
      </main>
    );
  }

  const descSource = workout.description ?? workout.notes ?? workout.description_raw ?? '';
  const descriptionItems = parseDescription(descSource);
  const segments = workout.segments ?? (Array.isArray(descriptionItems) ? descriptionItems.filter(it => typeof it === 'object' && (it.type || it.reps || it.distance_km || it.time_min)) : []);

  return (
    <main className="workout-detail">
      <div className="workout-card" role="region" aria-label="Detalle del entrenamiento">
        <header className="workout-header">
          <div>
            <h1 className="workout-title">{workout.type || 'Entrenamiento'}</h1>
            <div className="workout-meta">{workout.day || ''} • {workout.date || '—'} • Semana {workout.week || '—'}</div>
          </div>
          <div className="workout-sideinfo">
            <div className="small">Distancia</div>
            <div className="big">{typeof workout.distance_km === 'number' ? `${workout.distance_km} km` : (workout.distance_km || '—')}</div>
            <div className="small" style={{ marginTop: 8 }}>Ritmo objetivo</div>
            <div>{workout.pace_min_km || workout.pace_text || '—'}</div>
          </div>
        </header>

        <div className="workout-grid">
          <div className="description-section">
            <h2>Descripción</h2>
            <div className="prose">
              {Array.isArray(descriptionItems) && descriptionItems.length ? (
                <ol>
                  {descriptionItems.map((d, i) => {
                    if (!d && d !== 0) return null;

                    if (typeof d === 'string') {
                      return <li key={i}>{d}</li>;
                    }

                    if (typeof d === 'object') {
                      const human = renderObjectStep(d);
                      if (typeof human === 'string' && human.length) {
                        return <li key={i}>{human}</li>;
                      }
                      // si renderObjectStep devolvió null -> mostrar JSON formateado
                      return (
                        <li key={i}>
                          <pre style={{
                            whiteSpace: 'pre-wrap',
                            fontSize: 13,
                            background: 'rgba(255,255,255,0.02)',
                            padding: 10,
                            borderRadius: 8,
                            color: 'var(--text)'
                          }}>
                            {JSON.stringify(d, null, 2)}
                          </pre>
                        </li>
                      );
                    }

                    return <li key={i}>{String(d)}</li>;
                  })}
                </ol>
              ) : (
                <p className="text-muted">No hay descripción detallada para este entrenamiento.</p>
              )}
            </div>

            {/* Si además tienes segments explícitos, muéstralos en tabla */}
            {segments.length > 0 && (
              <div className="segments-table" style={{ marginTop: 12 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Tipo</th>
                      <th>Reps</th>
                      <th>Distancia / Tiempo</th>
                      <th>Ritmo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {segments.map((s, idx) => (
                      <tr key={idx}>
                        <td>{s.type || (s.__from_segment ? 'segment' : '-')}</td>
                        <td>{s.reps ?? '-'}</td>
                        <td>
                          {typeof s.distance_km === 'number' ? `${s.distance_km} km`
                            : (s.time_min_fast ? `${s.time_min_fast} / ${s.time_min_easy ?? '-'} min`
                              : (s.time_min ? `${s.time_min} min` : '-'))}
                        </td>
                        <td>{s.pace_min_km || s.pace_min_km_fast || s.pace || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {workout.advice && (
              <div style={{ marginTop: 14 }}>
                <h3>Consejos</h3>
                <p className="prose">{workout.advice}</p>
              </div>
            )}
          </div>

          <aside className="aside">
            <div className="meta-row">
              <span className="text-sm">Intensidad</span>
              <div className="value">{workout.intensity || '—'}</div>
            </div>

            <div className="meta-row">
              <span className="text-sm">Tiempo estimado</span>
              <div className="value">{workout.estimated_time || '—'}</div>
            </div>

            <div className="meta-row">
              <span className="text-sm">Estado</span>
              <div className={completed ? 'status-ok' : 'status-pending'}>{completed ? 'Completado' : 'Pendiente'}</div>
            </div>

            <div className="action-column mt-4">
              <button className="btn" onClick={() => navigate(-1)}>Volver</button>
              <button className="btn" onClick={() => markCompleted(!completed)} disabled={saving}>
                {saving ? 'Guardando...' : (completed ? 'Marcar como no realizado' : 'Marcar como completado')}
              </button>
              <button className="btn ghost" onClick={downloadJSON} style={{ marginTop: 6 }}>Descargar JSON</button>
            </div>

            {error && <div style={{ marginTop: 12, color: '#ffb4b4' }}>{error}</div>}
          </aside>
        </div>
      </div>
    </main>
  );
}
