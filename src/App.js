// src/App.js
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Main from './pages/Main';
import ProtectedRoute from './components/ProtectedRoutes';
import './App.css';
import NewTraining from './pages/NewTraining';
import TrainingWizard from './pages/TrainingWizard';
import Generating from './pages/Generating';
import Myplan from './pages/Myplan';
import WorkoutDetail from './pages/TrainingDetails';


function Welcome({ username, handleLogout }) {
  const navigate = useNavigate();

  return (
    <main className="center-area">
      <div className="card">
        {!username ? (
          <>
            <h1 className="brand">Coach 21K</h1>
            <p className="lead">Tu entrenador personal</p>

            <div className="actions">
              <button className="btn primary" onClick={() => navigate('/login')}>Iniciar sesión</button>
              <button className="btn ghost" onClick={() => navigate('/register')}>Registrarse</button>
            </div>
          </>
        ) : (
          <>
            <h1 className="brand">¡Hola, {username}!</h1>
            <p className="lead">Bienvenido de nuevo. Pulsa abajo para acceder a tu plan.</p>

            <div className="actions">
              <button className="btn primary" onClick={() => navigate('/main')}>Ir al panel</button>
              <button className="btn ghost" onClick={handleLogout}>Cerrar sesión</button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
// AppWrapper usa useNavigate (está dentro del Router)
function AppWrapper() {
  const navigate = useNavigate();
  const [username, setUsername] = useState(() => localStorage.getItem('username') || '');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    setUsername('');
    navigate('/');
  };

  return (
    <>
      <Routes>
        <Route path="/" element={<Welcome navigate={navigate} username={username} handleLogout={handleLogout} />} />
        <Route path="/register" element={<Register setUsername={setUsername} />} />
        <Route path="/login" element={<Login setUsername={setUsername} />} />
        <Route
          path="/main"
          element={
            <ProtectedRoute>
              <Main />
            </ProtectedRoute>
          }
        />
        <Route path='/newTraining' 
          element= {
            <ProtectedRoute>
              <TrainingWizard></TrainingWizard>
          
            </ProtectedRoute>
            }    
        />
        <Route path='/generating' 
                  element= {
                    <ProtectedRoute>
                      <Generating/>
                    </ProtectedRoute>
                    }    
                />
        <Route path='/plan' 
                  element= {
                    <ProtectedRoute>
                      <Myplan/>
                    </ProtectedRoute>
                    }    
                />
        <Route path='/training-details' 
                  element= {
                    <ProtectedRoute>
                      <WorkoutDetail/>
                    </ProtectedRoute>
                    }    
                />
        </Routes>
      <footer className="footer">
        {username ? <span className="muted">Conectado como <strong>{username}</strong></span> : <span className="muted">No conectado</span>}
      </footer>
    </>
  );
}


export default function App() {
  return (
    <Router>
      <AppWrapper />
    </Router>
  );
}
