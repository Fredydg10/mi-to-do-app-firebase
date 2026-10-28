import { useEffect, useState } from 'react';
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import {
  Calculator,
  CalendarDays,
  Check,
  Circle,
  ClipboardList,
  FolderKanban,
  LogOut,
  Plus,
  Settings,
  Trash2,
  UserRound
} from 'lucide-react';
import { db, auth } from './firebase';
import './TodoApp.css';

const calculatorButtons = [
  'C', 'DEL', '%', '/',
  '7', '8', '9', '*',
  '4', '5', '6', '-',
  '1', '2', '3', '+',
  '0', '.', '='
];

function calculate(expression) {
  const tokens = expression.match(/\d*\.?\d+|[+\-*/]/g);
  if (!tokens || tokens.join('') !== expression) {
    throw new Error('La operación no es válida.');
  }

  let position = 0;
  const parseNumber = () => {
    const token = tokens[position++];
    const number = Number(token);
    if (!Number.isFinite(number)) {
      throw new Error('La operación no es válida.');
    }
    return number;
  };

  const parseTerm = () => {
    let value = parseNumber();
    while (tokens[position] === '*' || tokens[position] === '/') {
      const operator = tokens[position++];
      const nextNumber = parseNumber();
      value = operator === '*' ? value * nextNumber : value / nextNumber;
    }
    return value;
  };

  let result = parseTerm();
  while (tokens[position] === '+' || tokens[position] === '-') {
    const operator = tokens[position++];
    const nextTerm = parseTerm();
    result = operator === '+' ? result + nextTerm : result - nextTerm;
  }

  if (position !== tokens.length || !Number.isFinite(result)) {
    throw new Error('La operación no es válida.');
  }
  return Number(result.toPrecision(12)).toString();
}

function formatTaskDate(createdAt) {
  if (!createdAt) return 'Fecha no disponible';
  const date = typeof createdAt.toDate === 'function'
    ? createdAt.toDate()
    : new Date(createdAt);
  if (Number.isNaN(date.getTime())) return 'Fecha no disponible';
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}

const TodoApp = () => {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('dashboard');
  const [taskError, setTaskError] = useState('');
  const [calcDisplay, setCalcDisplay] = useState('0');
  const [calcHistory, setCalcHistory] = useState('');
  const [isFreshCalculation, setIsFreshCalculation] = useState(false);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setLoading(false);
      return undefined;
    }

    const tasksQuery = query(
      collection(db, 'tasks'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      tasksQuery,
      (snapshot) => {
        const tasksData = snapshot.docs.map((taskDocument) => ({
          id: taskDocument.id,
          ...taskDocument.data()
        }));

        tasksData.sort((taskA, taskB) => {
          const timeA = taskA.createdAt?.seconds ?? 0;
          const timeB = taskB.createdAt?.seconds ?? 0;
          return timeB - timeA;
        });

        setTasks(tasksData);
        setTaskError('');
        setLoading(false);
      },
      (error) => {
        console.error('Error al cargar tareas:', error);
        setTaskError('No se pudieron cargar tus tareas. Intenta nuevamente.');
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const addTask = async (taskText) => {
    const text = taskText.trim();
    if (!text) return false;

    try {
      await addDoc(collection(db, 'tasks'), {
        text,
        completed: false,
        userId: auth.currentUser.uid,
        createdAt: new Date()
      });
      setNewTask('');
      setTaskError('');
      return true;
    } catch (error) {
      console.error('Error al agregar tarea:', error);
      setTaskError('No se pudo agregar la tarea. Intenta nuevamente.');
      return false;
    }
  };

  const handleAddTask = async (event) => {
    event.preventDefault();
    await addTask(newTask);
  };

  const toggleTask = async (task) => {
    try {
      await updateDoc(doc(db, 'tasks', task.id), {
        completed: !task.completed
      });
      setTaskError('');
    } catch (error) {
      console.error('Error al actualizar tarea:', error);
      setTaskError('No se pudo actualizar la tarea. Intenta nuevamente.');
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
      setTaskError('');
    } catch (error) {
      console.error('Error al eliminar tarea:', error);
      setTaskError('No se pudo eliminar la tarea. Intenta nuevamente.');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      setTaskError('No se pudo cerrar la sesión. Intenta nuevamente.');
    }
  };

  const handleCalculatorClick = (value) => {
    setTaskError('');
    if (value === 'C') {
      setCalcDisplay('0');
      setCalcHistory('');
      setIsFreshCalculation(false);
      return;
    }

    if (value === 'DEL') {
      setCalcDisplay((current) => (
        isFreshCalculation || current.length <= 1 ? '0' : current.slice(0, -1)
      ));
      setIsFreshCalculation(false);
      return;
    }

    if (value === '=') {
      try {
        const result = calculate(calcDisplay);
        setCalcHistory(`${calcDisplay} =`);
        setCalcDisplay(result);
        setIsFreshCalculation(true);
      } catch {
        setCalcHistory('');
        setCalcDisplay('Error');
        setIsFreshCalculation(true);
      }
      return;
    }

    if (value === '%') {
      const currentNumber = calcDisplay.match(/\d*\.?\d+$/)?.[0];
      if (currentNumber) {
        const percentage = String(Number(currentNumber) / 100);
        setCalcDisplay(calcDisplay.slice(0, -currentNumber.length) + percentage);
        setIsFreshCalculation(false);
      }
      return;
    }

    if (/^\d$/.test(value)) {
      setCalcDisplay((current) => (
        isFreshCalculation || current === '0' || current === 'Error'
          ? value
          : current + value
      ));
      setIsFreshCalculation(false);
      return;
    }

    if (value === '.') {
      const currentNumber = calcDisplay.match(/\d*\.?\d*$/)?.[0] ?? '';
      if (currentNumber.includes('.')) return;
      setCalcDisplay((current) => (
        isFreshCalculation
          ? `0${value}`
          : current.match(/[+\-*/]$/)
            ? `${current}0${value}`
            : `${current}${value}`
      ));
      setIsFreshCalculation(false);
      return;
    }

    setCalcDisplay((current) => {
      const expression = isFreshCalculation ? current.replace(/Error$/, '0') : current;
      return /[+\-*/]$/.test(expression)
        ? `${expression.slice(0, -1)}${value}`
        : `${expression}${value}`;
    });
    setIsFreshCalculation(false);
  };

  const sendCalculationToTasks = async () => {
    try {
      const result = calculate(calcDisplay);
      const added = await addTask(`Resultado: ${result}`);
      if (added) {
        setCalcHistory(`${calcDisplay} =`);
        setCalcDisplay(result);
        setIsFreshCalculation(true);
      }
    } catch {
      setTaskError('Primero ingresa una operación válida en la calculadora.');
    }
  };

  const completedTasks = tasks.filter((task) => task.completed);
  const pendingTasks = tasks.filter((task) => !task.completed);

  if (loading) {
    return (
      <div className="todo-loading" role="status">
        <span className="todo-loading-spinner" />
        Cargando tus tareas...
      </div>
    );
  }

  return (
    <div className="todo-app">
      <header className="todo-topbar">
        <a className="todo-brand" href="#dashboard" onClick={() => setActiveView('dashboard')}>
          <Calculator size={22} aria-hidden="true" />
          <span>Calc &amp; Tasks</span>
        </a>

        <nav className="todo-nav" aria-label="Navegación principal">
          <button
            className={activeView === 'dashboard' ? 'active' : ''}
            onClick={() => setActiveView('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={activeView === 'projects' ? 'active' : ''}
            onClick={() => setActiveView('projects')}
          >
            Projects
          </button>
          <button
            className={activeView === 'settings' ? 'active' : ''}
            onClick={() => setActiveView('settings')}
          >
            Settings
          </button>
        </nav>
        <button
          type="button"
          className="todo-logout-button todo-topbar-logout"
          onClick={handleLogout}
        >
          <LogOut size={16} aria-hidden="true" />
          <span>Cerrar sesión</span>
        </button>
      </header>

      <main className="todo-main">
        {taskError && (
          <p className="todo-error" role="alert">
            {taskError}
          </p>
        )}

        {activeView === 'dashboard' && (
          <section className="todo-dashboard" aria-label="Dashboard">
            <div className="todo-calculator-panel">
              <div className="todo-section-heading">
                <div>
                  <span className="todo-eyebrow">Tu espacio de trabajo</span>
                  <h1>Quick Calc</h1>
                </div>
                <span className="todo-heading-icon"><Calculator size={20} /></span>
              </div>

              <div className="todo-calculator">
                <div className="todo-calc-display" aria-live="polite">
                  <div className="todo-calc-history">{calcHistory || '\u00a0'}</div>
                  <div className="todo-calc-result">{calcDisplay}</div>
                </div>
                <div className="todo-calc-buttons">
                  {calculatorButtons.map((button) => (
                    <button
                      key={button}
                      type="button"
                      className={`todo-calc-button ${button === '=' ? 'equals' : ''} ${/[+\-*/%]/.test(button) ? 'operator' : ''}`}
                      onClick={() => handleCalculatorClick(button)}
                      aria-label={button === 'DEL' ? 'Borrar último dígito' : button}
                    >
                      {button}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                className="todo-send-result"
                onClick={sendCalculationToTasks}
              >
                <Plus size={18} aria-hidden="true" />
                Send result to Task
              </button>
            </div>

            <section className="todo-tasks-panel" aria-labelledby="tasks-heading">
              <div className="todo-section-heading todo-tasks-heading">
                <div>
                  <span className="todo-eyebrow">To-Do</span>
                  <h2 id="tasks-heading">Tasks &amp; Goals</h2>
                </div>
                <span className="todo-task-count">{pendingTasks.length}</span>
              </div>

              <form className="todo-add-form" onSubmit={handleAddTask}>
                <input
                  type="text"
                  value={newTask}
                  onChange={(event) => setNewTask(event.target.value)}
                  placeholder="¿Qué necesitas hacer?"
                  aria-label="Nueva tarea"
                />
                <button type="submit" aria-label="Agregar tarea" disabled={!newTask.trim()}>
                  <Plus size={20} />
                </button>
              </form>

              <div className="todo-task-list">
                {tasks.length === 0 ? (
                  <div className="todo-empty">
                    <ClipboardList size={30} aria-hidden="true" />
                    <p>No tienes tareas todavía.</p>
                    <span>Agrega una tarea para empezar.</span>
                  </div>
                ) : (
                  tasks.map((task) => (
                    <article
                      key={task.id}
                      className={`todo-task-card ${task.completed ? 'completed' : ''}`}
                    >
                      <button
                        type="button"
                        className="todo-task-toggle"
                        onClick={() => toggleTask(task)}
                        aria-label={task.completed ? `Marcar ${task.text} como pendiente` : `Completar ${task.text}`}
                        aria-pressed={Boolean(task.completed)}
                      >
                        {task.completed
                          ? <Check size={15} aria-hidden="true" />
                          : <Circle size={17} aria-hidden="true" />}
                      </button>
                      <div className="todo-task-content">
                        <p className="todo-task-title">{task.text}</p>
                        <span className="todo-task-status">
                          {task.completed ? 'Completada' : 'Pendiente'}
                        </span>
                        <span className="todo-task-date">
                          <CalendarDays size={13} aria-hidden="true" />
                          {formatTaskDate(task.createdAt)}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="todo-task-delete"
                        onClick={() => deleteTask(task.id)}
                        aria-label={`Eliminar ${task.text}`}
                      >
                        <Trash2 size={16} aria-hidden="true" />
                      </button>
                    </article>
                  ))
                )}
              </div>
            </section>
          </section>
        )}

        {activeView === 'projects' && (
          <section className="todo-secondary-view">
            <div className="todo-page-heading">
              <span className="todo-eyebrow">Organización</span>
              <h1>Projects</h1>
              <p>Resumen de tus tareas guardadas en tu cuenta.</p>
            </div>
            <div className="todo-summary-grid">
              <article className="todo-summary-card">
                <span className="todo-summary-icon blue"><FolderKanban size={21} /></span>
                <span className="todo-summary-label">Todas las tareas</span>
                <strong>{tasks.length}</strong>
              </article>
              <article className="todo-summary-card">
                <span className="todo-summary-icon green"><ClipboardList size={21} /></span>
                <span className="todo-summary-label">Pendientes</span>
                <strong>{pendingTasks.length}</strong>
              </article>
              <article className="todo-summary-card">
                <span className="todo-summary-icon violet"><Check size={21} /></span>
                <span className="todo-summary-label">Completadas</span>
                <strong>{completedTasks.length}</strong>
              </article>
            </div>
            <div className="todo-project-note">
              Las tareas se guardan en tu cuenta y aparecen en el Dashboard.
            </div>
          </section>
        )}

        {activeView === 'settings' && (
          <section className="todo-secondary-view">
            <div className="todo-page-heading">
              <span className="todo-eyebrow">Preferencias</span>
              <h1>Settings</h1>
              <p>Información de tu cuenta y de tus tareas.</p>
            </div>
            <article className="todo-settings-card">
              <div className="todo-settings-title">
                <span className="todo-summary-icon blue"><UserRound size={21} /></span>
                <div>
                  <h2>Tu cuenta</h2>
                  <p>Sesión iniciada con Firebase</p>
                </div>
              </div>
              <div className="todo-settings-row">
                <span>Correo electrónico</span>
                <strong>{auth.currentUser?.email || 'No disponible'}</strong>
              </div>
              <div className="todo-settings-row">
                <span>Tareas guardadas</span>
                <strong>{tasks.length}</strong>
              </div>
              <button type="button" className="todo-logout-button" onClick={handleLogout}>
                <LogOut size={17} />
                Cerrar sesión
              </button>
              <Settings className="todo-settings-watermark" size={130} aria-hidden="true" />
            </article>
          </section>
        )}
      </main>
    </div>
  );
};

export default TodoApp;
