import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import App from './App';

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (_auth, onChange) => {
    onChange(null);
    return vi.fn();
  },
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn()
}));

vi.mock('./firebase', () => ({
  auth: { currentUser: null },
  googleProvider: {}
}));

describe('Inicio de sesión', () => {
  it('mantiene disponible el acceso y el registro con Firebase', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Bienvenido de nuevo' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continuar con Google' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /logo de to-do app/i })).toBeInTheDocument();
    expect(document.querySelector('.auth-shell')).toBeInTheDocument();
  });

  it('permite cambiar de inicio de sesión a registro', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Regístrate' }));
    expect(screen.getByRole('heading', { name: 'Crea tu cuenta' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Registrarse' })).toBeInTheDocument();
  });
});
