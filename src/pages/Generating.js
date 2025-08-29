import React, { useEffect, useState } from 'react';
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

    useEffect(() => {
    if (!initialPayload) {
        setMessage('No hay datos para generar el plan. Vuelve al wizard.');
        setLoading(false);
        return;
    }

    const generate = async () => {
        try {
            const res = await axios.post('http://localhost:4000/api/generate-plan', initialPayload, { timeout: 120000 });
            let generatedPlan;

            if (res.data.success & res.data?.data){
                generatedPlan=res.data.data;
            }else if (res.data) {
                generatedPlan=res.data;
            }else {
                setError('Respuesta inesperada del servidor');
            }
            navigate('/plan', { state: { plan: generatedPlan } }); 
        } catch (error) {
            setError('Error generando el plan');
          } finally {
    setLoading(false); // desactivamos loading siempre
  }
    };

    generate();
    }, [initialPayload,navigate]);

    return (
    <main className="generating-wrap" aria-live="polite">
        <div className="generating-card" role="status" aria-busy={loading}>


        {/* Zona central: spinner o mensaje de estado */}
        <div className="generating-center">
            {loading ? (
            <div className="spinner-row">
                <OrbitProgress color="#318ccc" size="medium" text="" textColor="" />
                <p className="generating-text">Generando tu plan... esto puede tardar unos segundos</p>
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

      
      

