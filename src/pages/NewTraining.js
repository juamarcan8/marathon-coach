import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './NewTraining.css';


function NewTraining() {

    const [formState, setFormState] = useState({
        race_type: '',
        level: '',
        days_per_week: ''
    });

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
    const days_per_week = [
        {value: '1',label:'1'},
        {value: '2',label:'2'},
        {value: '3',label:'3'},
        {value: '4',label:'4'}
    ];
    //const handlePlan();
    return (
        <main className='center-area'>
        <div className='form-container'>
            <h2>Prepara tu plan</h2>
            <form> 
            {/* Race type */}
          <div className="field">
            <label className="field-label" htmlFor="race_type">Tipo de carrera</label>
            <select
              id="race_type"
              className="custom-select"
              value={formState.race_type}
              onChange={(e) => setFormState({ ...formState, race_type: e.target.value })}
              required
            >
              <option value="" disabled hidden>-- Selecciona una carrera --</option>
              {raceOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Level */}
          <div className="field">
            <label className="field-label" htmlFor="level">Nivel</label>
            <select
              id="level"
              className="custom-select"
              value={formState.level}
              onChange={(e) => setFormState({ ...formState, level: e.target.value })}
              required
            >
              <option value="" disabled hidden>-- Selecciona tu nivel --</option>
              {levelOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Days per week */}
          <div className="field">
            <label className="field-label" htmlFor="days_per_week">Días de entrenamiento/semana</label>
            <select
              id="days_per_week"
              className="custom-select"
              value={formState.days_per_week}
              onChange={(e) => setFormState({ ...formState, days_per_week: e.target.value })}
              required
            >
              <option value="" disabled hidden>-- Selecciona --</option>
              {days_per_week.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
            </form>
        </div>
    </main>
    );
}

export default NewTraining;