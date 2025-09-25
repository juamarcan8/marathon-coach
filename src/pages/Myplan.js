// src/pages/Myplan.jsx
import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import './Myplan.css';
import { useNavigate } from 'react-router-dom';

export default function Myplan() {
  const [workouts, setWorkouts] = useState([]);
  const [workout, setWorkout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWorkouts = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No autenticado. Inicia sesión por favor.');
          setLoading(false);
          navigate('/login');
          return;
        }

        const res = await axios.get('http://localhost:4000/api/workouts', {
          headers: { Authorization: `Bearer ${token}` }
        });

        const data = res.data?.workouts ?? res.data ?? [];
        const arr = Array.isArray(data) ? data : [];
        arr.sort((a, b) => (a.date || '').localeCompare(b.date || ''));

        setWorkouts(arr);

        const today = new Date();
        const next = arr.find(w => {
          if (!w.date) return false;
          const d = new Date(w.date + 'T00:00:00');
          return d >= new Date(today.getFullYear(), today.getMonth(), today.getDate());
        }) ?? arr[0] ?? null;

        setWorkout(next);

        if (next?.date) {
          const [y, m] = next.date.split('-');
          const idx = getMonthIndex(arr, Number(y), Number(m));
          setSelectedMonthIndex(idx >= 0 ? idx : 0);
        } else {
          setSelectedMonthIndex(0);
        }
      } catch (err) {
        console.error(err);
        const msg = err.response?.data?.error || err.message || 'Error obteniendo entrenamientos';
        setError(String(msg));
      } finally {
        setLoading(false);
      }
    };

    fetchWorkouts();
  }, [navigate]);

  const months = useMemo(() => buildMonthsFromWorkouts(workouts), [workouts]);

  const onSelectDate = (dateStr) => {
    const found = workouts.filter(w => w.date === dateStr);
    if (found.length) setWorkout(found[0]);
    else setWorkout(null);
  };

  const markDone = async (e) => {
    e?.stopPropagation();
    if (!workout) return;
    try {
      setWorkouts(prev => prev.filter(w => w.id !== workout.id));
      setWorkout(null);
    } catch (err) {
      console.error('Error marcando como hecho', err);
    }
  };

  const goPrevMonth = () => {
    setSelectedMonthIndex(i => Math.max(0, i - 1));
  };
  const goNextMonth = () => {
    setSelectedMonthIndex(i => Math.min(months.length - 1, i + 1));
  };

  const currentMonth = months.length ? months[selectedMonthIndex] : buildEmptyMonthForToday();

  return (
    <main className="plan-page">
      <div className="plan-wrapper">
        <h1 className="page-title">Próximos entrenamientos</h1>

        {loading ? (
          <div className="card loading">
            <div className="spinner" aria-hidden />
            <div className="loading-text">Cargando entrenamientos…</div>
          </div>
        ) : error ? (
          <div className="card empty">
            <p className="muted">{error}</p>
          </div>
        ) : (
          <>
            <div className="month-single-nav card nav-row">
              <button
                className="btn ghost nav-btn"
                onClick={goPrevMonth}
                disabled={selectedMonthIndex <= 0 || months.length === 0}
                aria-label="Mes anterior"
              >
                ‹
              </button>

              <div className="nav-title">
                <div className="nav-month-label">{currentMonth.label}</div>
                <div className="nav-month-sub">{months.length ? `${currentMonth.workoutsForMonth.length} entreno(s) este mes` : 'Sin entrenamientos este mes'}</div>
              </div>

              <button
                className="btn ghost nav-btn"
                onClick={goNextMonth}
                disabled={selectedMonthIndex >= months.length - 1 || months.length === 0}
                aria-label="Mes siguiente"
              >
                ›
              </button>
            </div>

            <div className="card calendar-card">
              <MiniMonthCalendar
                year={currentMonth.year}
                month={currentMonth.month}
                workoutsForMonth={currentMonth.workoutsForMonth}
                onSelectDate={(d) => onSelectDate(d)}
              />
            </div>

            <div className="plan-card-wrapper">
              {!workout ? (
                <div className="card empty">
                  <p className="muted">Selecciona un día con entrenamiento en el calendario.</p>
                </div>
              ) : (
                <article
                  className="card workout-card"
                  aria-label="Entrenamiento seleccionado"
                  onClick={() => navigate('/training-details', { state: { workout } })}
                >
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
                  </section>

                  <footer className="workout-footer">
                    <button
                      className="btn primary"
                      onClick={(e) => { e.stopPropagation(); navigate('/training-details', { state: { workout } }); }}
                    >
                      Ver detalles
                    </button>
                    <button
                      className="btn ghost"
                      onClick={markDone}
                    >
                      Marcar completado
                    </button>
                  </footer>
                </article>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function MiniMonthCalendar({ year, month, workoutsForMonth = [], onSelectDate }) {
  const firstOfMonth = new Date(year, month - 1, 1);
  const jsDay = firstOfMonth.getDay(); // 0 dom .. 6 sab
  const firstWeekday = (jsDay + 6) % 7; // lunes=0 .. domingo=6
  const lastDay = new Date(year, month, 0).getDate();

  const workoutDates = new Set((workoutsForMonth || []).map(w => w.date));

  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= lastDay; d++) {
    const dateStr = `${String(year).padStart(4,'0')}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    cells.push({ day: d, dateStr, hasWorkout: workoutDates.has(dateStr) });
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const todayStr = (() => {
    const t = new Date();
    return `${String(t.getFullYear()).padStart(4,'0')}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`;
  })();

  return (
    <div className="mini-month">
      <div className="weekdays">
        <div>Lu</div><div>Ma</div><div>Mi</div><div>Ju</div><div>Vi</div><div>Sá</div><div>Do</div>
      </div>
      <div className="grid">
        {cells.map((c, idx) => {
          if (!c) return <div key={idx} className="cell empty" />;
          const isToday = c.dateStr === todayStr;
          return (
            <button
              key={idx}
              className={`cell day ${c.hasWorkout ? 'has-workout' : ''} ${isToday ? 'is-today' : ''}`}
              onClick={(e) => { e.stopPropagation(); if (c.hasWorkout) onSelectDate(c.dateStr); }}
            >
              <span className="day-num">{c.day}</span>
              {c.hasWorkout && <span className="dot" aria-hidden />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function buildMonthsFromWorkouts(workouts = []) {
  const map = new Map();
  workouts.forEach(w => {
    if (!w.date) return;
    const [y, m] = w.date.split('-');
    if (!y || !m) return;
    const key = `${y}-${m}`;
    if (!map.has(key)) {
      const monthNum = Number(m);
      const label = new Date(Number(y), monthNum - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
      map.set(key, { year: Number(y), month: monthNum, label, workoutsForMonth: [] });
    }
    map.get(key).workoutsForMonth.push(w);
  });
  return Array.from(map.values()).sort((a, b) => (a.year - b.year) || (a.month - b.month));
}

function getMonthIndex(arr, year, month) {
  const months = buildMonthsFromWorkouts(arr);
  return months.findIndex(m => m.year === year && m.month === month);
}

function buildEmptyMonthForToday() {
  const t = new Date();
  const year = t.getFullYear();
  const month = t.getMonth() + 1;
  const label = new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  return { year, month, label, workoutsForMonth: [] };
}

function formatDateToDay(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString(undefined, { weekday: 'long' });
  } catch {
    return '';
  }
}
