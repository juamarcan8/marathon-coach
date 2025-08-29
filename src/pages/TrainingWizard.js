// src/pages/TrainingWizard.jsx
import React, { useState, useRef } from 'react';
import axios from 'axios';
import './TrainingWizard.css';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';

// Helper: convierte "HH:MM:SS", "H:MM", "MM:SS" o "MM" a minutos (número, float)
function parseTimeToMinutes(input) {
  if (!input) return null;
  const s = input.trim();
  if (!s) return null;
  const parts = s.split(':').map(p => p.trim()).filter(Boolean);
  // 3 partes -> HH:MM:SS
  if (parts.length === 3) {
    const h = Number(parts[0]), m = Number(parts[1]), sec = Number(parts[2]);
    if ([h,m,sec].some(v => !Number.isFinite(v) || v < 0)) return null;
    return h * 60 + m + sec / 60;
  }
  // 2 partes -> could be HH:MM or MM:SS — detect heuristically
  if (parts.length === 2) {
    const a = Number(parts[0]), b = Number(parts[1]);
    if (!Number.isFinite(a) || !Number.isFinite(b) || a < 0 || b < 0) return null;
    // if the first part is >= 24 maybe it's minutes:seconds, but heuristic:
    // If a >= 3 treat as MM:SS (e.g., "22:30" -> 22m30s)
    // If a <= 2 treat as H:MM (e.g., "1:45" -> 1h45m)
    if (a >= 3) {
      return a + b / 60; // MM:SS
    } else {
      return a * 60 + b; // H:MM
    }
  }
  // 1 part -> minutes
  const n = Number(parts[0]);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

// Helper robusto: calcula días y semanas entre hoy y dateString (YYYY-MM-DD)
function computeDaysAndWeeksFromDate(dateString) {
  if (!dateString) return null;
  const [y, m, d] = dateString.split('-').map(Number);
  if (!y || !m || !d) return null;
  const race = new Date(y, m - 1, d); // local midnight
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msPerDay = 24 * 60 * 60 * 1000;
  const diffMs = race.getTime() - today.getTime();
  const days = Math.ceil(diffMs / msPerDay);
  const weeks = Math.max(0, Math.ceil(days / 7));
  return { days, weeks };
}

export default function TrainingWizard() {

  const navigate = useNavigate();
  const steps = [
    { key: 'race_type', title: '¿Qué carrera quieres preparar?' },
    { key: 'level', title: '¿Cuál es tu nivel?' },
    { key: 'days_per_week', title: '¿Cuántos días a la semana entrenas?' },
    { key: 'race_date', title: '¿Qué día es la carrera?' },
    { key: 'preferred_longrun_day', title: '¿Qué día prefieres para el long run? (opcional)' },
    { key: 'target_time', title: '¿Tienes un tiempo objetivo? (opcional)' },
    { key: 'recent_5k', title: '¿Tu mejor 5k reciente? (opcional)' },
    { key: 'summary', title: 'Resumen y generar plan' }
  ];

  const raceOptions = [
    { value: '5k', label: '5 km' },
    { value: '10k', label: '10 km' },
    { value: '21k', label: 'Media Maratón (21 km)' },
    { value: '42k', label: 'Maratón (42 km)' }
  ];
  const levelOptions = [
    { value: 'principiante', label: 'Principiante' },
    { value: 'intermedio', label: 'Intermedio' },
    { value: 'avanzado', label: 'Avanzado' }
  ];
  const daysPerWeekOptions = ['1','2','3','4','5','6','7'];
  const weekDays = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];

  const [formState, setFormState] = useState({
    race_type: '',
    level: '',
    days_per_week: '',
    race_date: '',
    preferred_longrun_day: '',
    target_time: '',    // expected "HH:MM:SS" if possible
    recent_5k: '',      // expected "HH:MM:SS" or "MM:SS"
  });

  const [stepIndex, setStepIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [plan, setPlan] = useState(null);
  const sliderRef = useRef(null);


  const goNext = () => { if (stepIndex < steps.length - 1) setStepIndex(stepIndex + 1); };
  const goPrev = () => { if (stepIndex > 0) setStepIndex(stepIndex - 1); };

  const validateStep = (index) => {
    const f = formState;
    const key = steps[index].key;
    switch (key) {
      case 'race_type':
        if (!f.race_type) return 'Selecciona el tipo de carrera.';
        return null;
      case 'level':
        if (!f.level) return 'Selecciona tu nivel.';
        return null;
      case 'days_per_week':
        if (!f.days_per_week) return 'Selecciona días por semana.';
        return null;
      case 'race_date':
        if (!f.race_date) return 'Selecciona una fecha de carrera.';
        const info = computeDaysAndWeeksFromDate(f.race_date);
        if (!info) return 'Fecha inválida.';
        if (info.days <= 0) return 'La fecha debe ser futura.';
        if (info.weeks < 1) return 'Necesitas al menos 1 semana hasta la carrera.';
        if (info.weeks > 26) return 'No se puede generar un plan de más de 26 semanas.';
        return null;
      case 'target_time':
        if (f.target_time && parseTimeToMinutes(f.target_time) === null) return 'Tiempo objetivo inválido.';
        return null;
      case 'recent_5k':
        if (f.recent_5k && parseTimeToMinutes(f.recent_5k) === null) return 'Formato 5k inválido.';
        return null;
      default:
        return null;
    }
  };

  const handleNext = () => {
    setError('');
    const v = validateStep(stepIndex);
    if (v) { setError(v); return; }
    if (steps[stepIndex].key === 'race_date' && formState.race_date) {
      const info = computeDaysAndWeeksFromDate(formState.race_date);
      if (info) {
        setFormState(prev => ({ ...prev, weeks_until_race: info.weeks }));
      }
    }
    goNext();
  };

  const handleSubmit = async () => {
    setError('');
    for (let i = 0; i < steps.length; i++) {
      const v = validateStep(i);
      if (v) { setStepIndex(i); setError(v); return; }
    }

    const payload = {
      userId : localStorage.getItem('userId'),
      race_type: formState.race_type,
      level: formState.level,
      days_per_week: Number(formState.days_per_week),
      race_date: formState.race_date,
      weeks_until_race: Number(formState.weeks_until_race),
      preferred_longrun_day: formState.preferred_longrun_day || null,
      target_time_minutes: formState.target_time ? parseTimeToMinutes(formState.target_time) : null,
      recent_5k_minutes: formState.recent_5k ? parseTimeToMinutes(formState.recent_5k) : null
    };
    console.log(payload)
    localStorage.setItem('pending_plan_payload', JSON.stringify(payload));
    setLoading(true);
    navigate('/generating', { state: payload });
  };

  const renderStepContent = (index) => {
    const key = steps[index].key;
    switch (key) {
      case 'race_type':
        return (
          <div className="question">
            <p className="question-title">{steps[index].title}</p>
            <div className="options-grid">
              {raceOptions.map(opt => (
                <button key={opt.value} type="button"
                  className={`option-btn ${formState.race_type === opt.value ? 'selected' : ''}`}
                  onClick={() => setFormState({ ...formState, race_type: opt.value })}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        );
      case 'level':
        return (
          <div className="question">
            <p className="question-title">{steps[index].title}</p>
            <div className="options-grid">
              {levelOptions.map(opt => (
                <button key={opt.value} type="button"
                  className={`option-btn ${formState.level === opt.value ? 'selected' : ''}`}
                  onClick={() => setFormState({ ...formState, level: opt.value })}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        );
      case 'days_per_week':
        return (
          <div className="question">
            <p className="question-title">{steps[index].title}</p>
            <div className="options-grid">
              {daysPerWeekOptions.map(opt => (
                <button key={opt} type="button"
                  className={`option-btn ${formState.days_per_week === opt ? 'selected' : ''}`}
                  onClick={() => setFormState({ ...formState, days_per_week: opt })}>
                  {opt} días
                </button>
              ))}
            </div>
          </div>
        );
      case 'race_date': {
        const info = formState.race_date ? computeDaysAndWeeksFromDate(formState.race_date) : null;
        return (
          <div className="question">
            <p className="question-title">{steps[index].title}</p>
            <input type="date" className="input-text"
              value={formState.race_date}
              onChange={(e) => setFormState({ ...formState, race_date: e.target.value })} />
            {info && <p className="help">Quedan {info.days} días (~{info.weeks} semanas) hasta la carrera</p>}
          </div>
        );
      }

      case 'preferred_longrun_day':
        return (
          <div className="question">
            <p className="question-title">{steps[index].title}</p>
            <div className="options-grid">
              {weekDays.map(day => (
                <button key={day} type="button"
                  className={`option-btn ${formState.preferred_longrun_day === day ? 'selected' : ''}`}
                  onClick={() => setFormState({ ...formState, preferred_longrun_day: day })}>
                  {day}
                </button>
              ))}
              <button type="button" className={`option-btn ${formState.preferred_longrun_day === '' ? 'selected' : ''}`}
                onClick={() => setFormState({ ...formState, preferred_longrun_day: '' })}>
                No tengo preferencia
              </button>
            </div>
          </div>
        );

      case 'target_time':
        return (
          <div className="question">
            <p className="question-title">{steps[index].title}</p>
            <input type="time" className="input-time" step="1" // step=1 permite segundos (si el navegador lo soporta)
              value={formState.target_time}
              onChange={(e) => setFormState({ ...formState, target_time: e.target.value })} />
            <p className="help">Formato sugerido: HH:MM:SS (ej. 01:45:00). Si tu navegador no muestra segundos, puedes escribir MM:SS o HH:MM.</p>
          </div>
        );

      case 'recent_5k':
        return (
          <div className="question">
            <p className="question-title">{steps[index].title}</p>
            <input type="time" className="input-time" step="1"
              value={formState.recent_5k}
              onChange={(e) => setFormState({ ...formState, recent_5k: e.target.value })} />
            <p className="help">Formato sugerido: MM:SS o HH:MM:SS (ej. 22:30 o 00:22:30).</p>
          </div>
        );

      case 'summary':
        return (
          <div className="question">
            <p className="question-title">Comprueba y genera</p>
            <div className="summary">
              <pre>{JSON.stringify(formState, null, 2)}</pre>
              <p className="help">Pulsa Generar para enviar los datos al entrenador (IA).</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <main className="wizard-wrap" aria-live="polite">
      <div className="wizard-card">
        <div className="wizard-header">
          <div className="progress">
            {steps.map((s, i) => (<div key={s.key} className={`dot ${i <= stepIndex ? 'active' : ''}`} aria-hidden />))}
          </div>
          <div className="step-count">Pregunta {Math.min(stepIndex + 1, steps.length)} / {steps.length}</div>
        </div>

        <div className="slider-viewport">
          <div className="slider-inner" ref={sliderRef} style={{ transform: `translateX(-${stepIndex * 100}%)` }}>
            {steps.map((s,i) => (<div key={s.key} className="slide">{renderStepContent(i)}</div>))}
          </div>
        </div>

        {error && <div className="wizard-error" role="alert">{error}</div>}

        <div className="wizard-footer">
          <button className="btn ghost small" onClick={goPrev} disabled={stepIndex === 0}>Atrás</button>
          {stepIndex < steps.length - 1 ? (
            <button className="btn primary small" onClick={handleNext}>Siguiente</button>
          ) : (
            <button className="btn primary small" onClick={handleSubmit} disabled={loading} aria-busy={loading}>
              {loading ? 'Generando…' : 'Generar plan'}
            </button>
          )}
        </div>

        {plan && (
          <section className="result">
            <h3>Plan generado</h3>
            <pre>{JSON.stringify(plan, null, 2)}</pre>
          </section>
        )}
      </div>
    </main>
  );
}
