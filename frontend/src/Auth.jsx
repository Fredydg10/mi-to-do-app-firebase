// frontend/src/Auth.jsx
import React, { useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signInWithPopup
} from 'firebase/auth';
import { auth, googleProvider } from './firebase';
import logoApp from './assets/logo-app.png';

const Auth = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      onLogin(auth.currentUser);
    } catch (err) {
      setError(err.message.replace('Firebase: ', '').replace(/\s*\(auth\/[^)]+\)\.?$/, ''));
    }
  };

  const handleGoogleAuth = async () => {
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
      onLogin(auth.currentUser);
    } catch (err) {
      setError(err.message.replace('Firebase: ', '').replace(/\s*\(auth\/[^)]+\)\.?$/, ''));
    }
  };

  return (
    <main className="auth-shell">
      <div className="auth-glow auth-glow-blue" />
      <div className="auth-glow auth-glow-green" />
      <section className="auth-card">
        <div className="auth-brand">
          <img src={logoApp} alt="Logo de To-Do App" />
          <span>Calc <b>&amp;</b> Tasks</span>
        </div>

        <header className="auth-heading">
          <span className="auth-eyebrow">Tu espacio de trabajo</span>
          <h1>{isLogin ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}</h1>
          <p>
            {isLogin
              ? 'Inicia sesión para continuar con tus tareas.'
              : 'Regístrate para organizar tus tareas y cálculos.'}
          </p>
        </header>
        
        {error && <div className="auth-error" role="alert">{error}</div>}
        
        <form onSubmit={handleEmailAuth} className="auth-form">
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            aria-label="Correo electrónico"
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete={isLogin ? 'current-password' : 'new-password'}
            aria-label="Contraseña"
          />
          <button type="submit" className="auth-submit">
            {isLogin ? 'Entrar' : 'Registrarse'}
          </button>
        </form>

        <div className="auth-divider">
          <span>o continúa con</span>
        </div>

        <button onClick={handleGoogleAuth} className="auth-google">
          <span className="auth-google-mark" aria-hidden="true">G</span>
          Continuar con Google
        </button>

        <p className="auth-switch">
          {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
          <button 
            onClick={() => setIsLogin(!isLogin)} 
            type="button"
          >
            {isLogin ? 'Regístrate' : 'Inicia sesión'}
          </button>
        </p>
      </section>
    </main>
  );
};

export default Auth;