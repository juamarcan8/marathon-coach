import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';


export default function Main() {
    const navigate = useNavigate();

    const [message, setMessage] = useState('');
    const username = localStorage.getItem('username');

    useEffect(() => {
        const token = localStorage.getItem('token');

        axios
        .get('http://localhost:4000/home-data', {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => setMessage(res.data.message))
        .catch(() => setMessage('Error al obtener datos del servidor'));
    }, []);


    return (
        <main class = 'center-area'>
            <div>

            <p>Bienvenido {username}</p>
            <p>{message}</p>

            <div className="actions">
                <button className="btn primary" onClick={() => navigate('/newTraining')}>Nuevo plan de entrenamiento</button>
                <button className="btn primary" onClick={() => navigate('/plan')}>Sigue tu plan</button>
            </div>

         
            </div>
        </main>
    );
}
