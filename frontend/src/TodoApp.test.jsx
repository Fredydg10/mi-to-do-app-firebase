import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { signOut } from 'firebase/auth';
import { addDoc } from 'firebase/firestore';
import { vi } from 'vitest';
import TodoApp from './TodoApp';

vi.mock('./firebase', () => ({
  auth: { currentUser: { uid: 'user-1', email: 'fredy@example.com' } },
  db: {}
}));

vi.mock('firebase/auth', () => ({
  signOut: vi.fn()
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn((_db, name) => ({ name })),
  addDoc: vi.fn().mockResolvedValue({ id: 'task-1' }),
  query: vi.fn((...args) => args),
  where: vi.fn((...args) => args),
  onSnapshot: vi.fn((_query, onData) => {
    onData({ docs: [] });
    return vi.fn();
  }),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  doc: vi.fn((_db, collectionName, id) => ({ collectionName, id }))
}));

describe('Dashboard de tareas', () => {
  it('muestra la calculadora y permite agregar su resultado como tarea', async () => {
    render(<TodoApp />);

    expect(screen.getByRole('heading', { name: 'Tasks & Goals' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Navegación principal' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '7' }));
    fireEvent.click(screen.getByRole('button', { name: '+' }));
    fireEvent.click(screen.getByRole('button', { name: '5' }));
    fireEvent.click(screen.getByRole('button', { name: '=' }));
    expect(screen.getByText('12')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Send result to Task' }));

    await waitFor(() => {
      expect(addDoc).toHaveBeenCalledWith(
        { name: 'tasks' },
        expect.objectContaining({
          text: 'Resultado: 12',
          completed: false,
          userId: 'user-1'
        })
      );
    });
  });

  it('muestra las vistas de Projects y Settings', () => {
    render(<TodoApp />);

    fireEvent.click(screen.getByRole('button', { name: 'Projects' }));
    expect(screen.getByRole('heading', { name: 'Projects' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
  });

  it('muestra cerrar sesión en el navbar y cierra sesión con el botón explícito', async () => {
    render(<TodoApp />);

    const navigation = screen.getByRole('navigation', { name: 'Navegación principal' });
    expect(navigation).not.toHaveTextContent('Cerrar sesión');
    expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));

    await waitFor(() => {
      expect(signOut).toHaveBeenCalled();
    });
  });
});
