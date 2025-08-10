import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Main() {
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
        <h1>Página principal</h1>
        <p>Bienvenido {username}</p>
        <p>{message}</p>
        </div>
    </main>
  );
}
