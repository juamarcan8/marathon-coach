import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Register() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();

    // 🔹 Validación en frontend
    if (password !== confirmPassword) {
      setMessage('Las contraseñas no coinciden');
      setIsError(true);
      return;
    }

    try {
      const res = await axios.post('http://localhost:4000/register', {
        username,
        password,
        email,
        confirmPassword
      });
      setMessage(res.data.message);
      setIsError(false);
      navigate('/login');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Error en el registro');
      setIsError(true);
    }
  };

  return (
    <main className="center-area">
    <div className="form-container">
      <h2>Registro</h2>
      <form onSubmit={handleRegister}>
        <input
          type="email"
          name="email"
          placeholder="Correo electrónico"
          value={email}
          required
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="text"
          name="username"
          placeholder="Usuario"
          value={username}
          required
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          name="password"
          placeholder="Contraseña"
          value={password}
          required
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirmar contraseña"
          value={confirmPassword}
          required
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <button type="submit">Registrar</button>
      </form>
      
      {message && (
        <p style={{ color: isError ? 'red' : 'green' }}>{message}</p>
      )}
    </div>
    </main>
  );
}

export default Register;
