// src/pages/Login.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Login({ setUsername }) {
  const navigate = useNavigate();
  const [usernameLocal, setUsernameLocal] = useState(''); // nombre local del form
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post('https://marathon-coach-backend-1.onrender.com/login', {
        username: usernameLocal,
        password
      });
      console.log(res.data);
      // Guardamos token y nombre de usuario
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('username', res.data.username);
      localStorage.setItem('userId', res.data.userId);
      // Actualizamos estado en App (si te pasaron setUsername)
      if (typeof setUsername === 'function') setUsername(res.data.username);

      setMessage('Login correcto ✅');
      setIsError(false);

      // Ir a la ruta protegida (usa /main si es donde está tu panel)
      navigate('/main');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Error al iniciar sesión');
      setIsError(true);
    }
  };

  return (
    <main className="center-area">
        <div className="form-container">
          <h2>Iniciar Sesión</h2>
          <form onSubmit={handleLogin}>
            <input
              type="text"
              name="username"
              placeholder="Usuario"
              value={usernameLocal}
              required
              autoComplete="username"
              onChange={(e) => setUsernameLocal(e.target.value)}
            />
            <input
              type="password"
              name="password"
              placeholder="Contraseña"
              value={password}
              required
              autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit" className="btn primary">Entrar</button>
          </form>

          {message && (
            <p className={`message ${isError ? 'error' : 'ok'}` } style={{ textAlign: 'center' }}>
              {message}
            </p>
          )}
        </div>
    </main>
  );
}

export default Login;
