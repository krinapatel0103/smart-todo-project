import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import '../styles/Dashboard.css';

function Dashboard() {
  const [todos,           setTodos]           = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState('');
  const [showModal,       setShowModal]       = useState(false);
  const [editTodo,        setEditTodo]        = useState(null);
  const [filterStatus,    setFilterStatus]    = useState('all');
  const [filterPriority,  setFilterPriority]  = useState('all');
  const [filterTag,       setFilterTag]       = useState('all');
  const [searchText,      setSearchText]      = useState('');
  const [submitting,      setSubmitting]      = useState(false);
  const [darkMode,        setDarkMode]        = useState(false);
  const [showNotif,       setShowNotif]       = useState(false);
  const [notifEnabled,    setNotifEnabled]    = useState(true);
  const [formData,        setFormData]        = useState({
    title        : '',
    priority     : 1,
    tags         : '',
    deadline_date: '',
    deadline_time: '',
    subtasks     : [],
  });

  const navigate      = useNavigate();
  const username      = localStorage.getItem('username') || '';
  const avatarLetters = username.slice(0, 2).toUpperCase();
  const availableTags = ['work', 'personal', 'study', 'shopping', 'health', 'office'];
  const bellRef       = useRef(null);

  // ─── Dark Mode ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved === 'true') {
      setDarkMode(true);
      document.body.classList.add('dark');
    }
    const notif = localStorage.getItem('notificationsEnabled');
    if (notif === 'false') setNotifEnabled(false);
  }, []);

  const toggleDarkMode = () => {
    const newVal = !darkMode;
    setDarkMode(newVal);
    localStorage.setItem('darkMode', newVal);
    document.body.classList.toggle('dark', newVal);
  };

  // ─── Close dropdown when clicking outside ───────────────────────────────────
  useEffect(() => {
    const handleClick = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setShowNotif(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ─── Deadline Logic ──────────────────────────────────────────────────────────
  const getDeadlineStatus = (todo) => {
    if (todo.completed) return null;
    if (!todo.deadline_date) return null;

    const now      = new Date();
    const deadline = new Date(`${todo.deadline_date}T${todo.deadline_time || '23:59:00'}`);
    const diffMs   = deadline - now;
    const diffHrs  = diffMs / (1000 * 60 * 60);

    if (diffMs < 0)       return 'overdue';
    if (diffHrs <= 24)    return 'due-soon';
    return null;
  };

  // ─── Fetch + Auto Show ───────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/todos/');
      setTodos(res.data);

      // Auto show notifications on load
      const notif = localStorage.getItem('notificationsEnabled');
      if (notif !== 'false') {
        const hasAlert = res.data.some(t => {
          if (t.completed || !t.deadline_date) return false;
          const now      = new Date();
          const deadline = new Date(`${t.deadline_date}T${t.deadline_time || '23:59:00'}`);
          const diffHrs  = (deadline - now) / (1000 * 60 * 60);
          return deadline < now || diffHrs <= 24;
        });
        if (hasAlert) {
          setTimeout(() => setShowNotif(true), 800);
        }
      }
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        navigate('/login');
      } else {
        setError('Failed to load todos.');
      }
    } finally {
      setLoading(false);
    }
  };

  const alertTodos = todos.filter(t => getDeadlineStatus(t) !== null);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    document.body.classList.remove('dark');
    navigate('/login');
  };

  // ─── Current Time/Date ───────────────────────────────────────────────────────
  const getCurrentTime = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  };
  const getCurrentDate = () => new Date().toISOString().split('T')[0];

  // ─── Modal ───────────────────────────────────────────────────────────────────
  const openAddModal = () => {
    setEditTodo(null);
    setFormData({
      title        : '',
      priority     : 1,
      tags         : '',
      deadline_date: getCurrentDate(),
      deadline_time: getCurrentTime(),
      subtasks     : [],
    });
    setShowModal(true);
  };

  const openEditModal = (todo) => {
    setEditTodo(todo);
    setFormData({
      title        : todo.title,
      priority     : todo.priority,
      tags         : todo.tags || '',
      deadline_date: todo.deadline_date || '',
      deadline_time: todo.deadline_time ? todo.deadline_time.slice(0,5) : '',
      subtasks     : todo.subtasks || [],
    });
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditTodo(null); };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ─── Subtasks ────────────────────────────────────────────────────────────────
  const addSubtask = () => {
    setFormData({
      ...formData,
      subtasks: [...formData.subtasks, { id: Date.now(), title: '', completed: false }],
    });
  };

  const updateSubtaskTitle = (id, title) => {
    setFormData({
      ...formData,
      subtasks: formData.subtasks.map(s => s.id === id ? { ...s, title } : s),
    });
  };

  const toggleSubtaskInModal = (id) => {
    setFormData({
      ...formData,
      subtasks: formData.subtasks.map(s => s.id === id ? { ...s, completed: !s.completed } : s),
    });
  };

  const removeSubtask = (id) => {
    setFormData({
      ...formData,
      subtasks: formData.subtasks.filter(s => s.id !== id),
    });
  };

  const toggleSubtaskOnCard = async (todo, subtaskId) => {
    const updatedSubtasks = todo.subtasks.map(s =>
      s.id === subtaskId ? { ...s, completed: !s.completed } : s
    );
    try {
      await axiosInstance.put(`/todos/${todo.id}`, {
        title        : todo.title,
        priority     : todo.priority,
        tags         : todo.tags,
        deadline_date: todo.deadline_date,
        deadline_time: todo.deadline_time,
        completed    : todo.completed,
        subtasks     : updatedSubtasks,
      });
      fetchTodos();
    } catch (err) {
      setError('Failed to update subtask.');
    }
  };

  // ─── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        priority: parseInt(formData.priority),
        subtasks: formData.subtasks.filter(s => s.title.trim() !== ''),
      };
      if (editTodo) {
        await axiosInstance.put(`/todos/${editTodo.id}`, {
          ...payload, completed: editTodo.completed,
        });
      } else {
        await axiosInstance.post('/todos/', payload);
      }
      closeModal();
      fetchTodos();
    } catch (err) {
      setError('Failed to save todo.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleComplete = async (todo) => {
    try {
      await axiosInstance.patch(`/todos/${todo.id}/complete`);
      fetchTodos();
    } catch (err) {
      setError('Failed to update.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this todo?')) return;
    try {
      await axiosInstance.delete(`/todos/${id}`);
      fetchTodos();
    } catch (err) {
      setError('Failed to delete.');
    }
  };

  // ─── Filter ──────────────────────────────────────────────────────────────────
  const filteredTodos = todos.filter(todo => {
    const statusMatch =
      filterStatus === 'all'       ? true :
      filterStatus === 'completed' ? todo.completed : !todo.completed;
    const priorityMatch =
      filterPriority === 'all' ? true :
      todo.priority === parseInt(filterPriority);
    const tagMatch =
      filterTag === 'all' ? true :
      todo.tags && todo.tags.split(',').map(t => t.trim()).includes(filterTag);
    const searchMatch =
      searchText === '' ? true :
      todo.title.toLowerCase().includes(searchText.toLowerCase()) ||
      (todo.tags && todo.tags.toLowerCase().includes(searchText.toLowerCase()));
    return statusMatch && priorityMatch && tagMatch && searchMatch;
  });

  const totalTodos     = todos.length;
  const completedTodos = todos.filter(t => t.completed).length;
  const pendingTodos   = totalTodos - completedTodos;
  const priorityLabel  = (p) => ({ 1: 'Low', 2: 'Medium', 3: 'High' }[p] || p);

  if (loading) return <div className="loading-screen">Loading todos...</div>;

  return (
    <div className="dashboard-container">

      {/* ─── Navbar ─────────────────────────────────────────────────────── */}
      <nav className="navbar">
        <div className="navbar-brand">
          <div className="navbar-brand-icon">S</div>
          Smart Todo
        </div>
        <div className="navbar-right">
          <div className="navbar-avatar">{avatarLetters}</div>
          <span className="navbar-welcome">Welcome, {username}</span>

          {/* Bell Icon */}
          <div className="bell-wrapper" ref={bellRef}>
            <button className="bell-btn" onClick={() => setShowNotif(!showNotif)} title="Notifications">
              🔔
              {alertTodos.length > 0 && <span className="bell-badge"></span>}
            </button>

            {/* Notification Dropdown */}
            {showNotif && (
              <div className="notification-dropdown">
                <div className="notif-header">
                  <h4>Notifications</h4>
                  <span>{alertTodos.length} alerts</span>
                </div>
                <div className="notif-list">
                  {alertTodos.length === 0 ? (
                    <div className="notif-empty">All tasks are on time! ✅</div>
                  ) : (
                    alertTodos.map(todo => {
                      const status = getDeadlineStatus(todo);
                      return (
                        <div key={todo.id} className="notif-item">
                          <div className={`notif-dot ${status}`}></div>
                          <div className="notif-text">
                            <div className="notif-title">{todo.title}</div>
                            <div className="notif-time">
                              📅 {todo.deadline_date} ⏰ {todo.deadline_time?.slice(0,5)}
                            </div>
                          </div>
                          <span className={`notif-tag ${status}`}>
                            {status === 'overdue' ? 'Overdue' : 'Due Soon'}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          <button className="dark-toggle" onClick={toggleDarkMode} title="Toggle dark mode">
            {darkMode ? '☀️' : '🌙'}
          </button>
          <button className="settings-btn" onClick={() => navigate('/settings')} title="Settings">
            ⚙️
          </button>
          <button className="analytics-btn" onClick={() => navigate('/analytics')}>
            📊 Analytics
          </button>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="dashboard-sticky-top">
          {error && <div className="dashboard-error">{error}</div>}

          <div className="dashboard-topbar">
            <div className="dashboard-title-section">
              <h1>Dashboard</h1>
              <p>Manage your daily tasks and priorities</p>
            </div>
            <button className="add-todo-btn" onClick={openAddModal}>+ Add New Task</button>
          </div>

          <div className="stats-bar">
            <div className="stat-card total">
              <div className="stat-icon">{String(totalTodos).padStart(2,'0')}</div>
              <div>
                <div className="stat-label">Total Todos</div>
                <div className="stat-title">Active Tasks</div>
              </div>
            </div>
            <div className="stat-card done">
              <div className="stat-icon">{String(completedTodos).padStart(2,'0')}</div>
              <div>
                <div className="stat-label">Completed</div>
                <div className="stat-title">Finished Items</div>
              </div>
            </div>
            <div className="stat-card pending">
              <div className="stat-icon">{String(pendingTodos).padStart(2,'0')}</div>
              <div>
                <div className="stat-label">Pending</div>
                <div className="stat-title">Awaiting Action</div>
              </div>
            </div>
          </div>

          <div className="filter-bar">
            <div className="search-wrapper">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search by title or tag..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
            <select value={filterTag} onChange={(e) => setFilterTag(e.target.value)}>
              <option value="all">All Tags</option>
              {availableTags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
            <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
              <option value="all">All Priority</option>
              <option value="1">Low</option>
              <option value="2">Medium</option>
              <option value="3">High</option>
            </select>
          </div>
        </div>

        {/* ─── Scrollable Todos ────────────────────────────────────────── */}
        <div className="dashboard-scrollable">
          {filteredTodos.length === 0 ? (
            <div className="empty-state">
              <h3>No todos found!</h3>
              <p>Click "+ Add New Task" to get started.</p>
            </div>
          ) : (
            <div className="todos-grid">
              {filteredTodos.map(todo => {
                const alertStatus = getDeadlineStatus(todo);
                return (
                  <div
                    key={todo.id}
                    className={`todo-card ${todo.completed ? 'completed' : ''} ${alertStatus || ''}`}
                  >
                    {/* Priority + Alert Tag */}
                    <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'10px'}}>
                      <span className={`priority-badge priority-${todo.priority}`}>
                        {priorityLabel(todo.priority)}
                      </span>
                      {alertStatus && (
                        <span className={`alert-tag ${alertStatus}`}>
                          {alertStatus === 'overdue' ? '🔴 Overdue' : '🟡 Due Soon'}
                        </span>
                      )}
                    </div>

                    <div className="todo-card-header">
                      <span className={`todo-title ${todo.completed ? 'done' : ''}`}>
                        {todo.title}
                      </span>
                      <div className="todo-card-actions-top">
                        <button className="btn-icon" onClick={() => openEditModal(todo)} title="Edit">✎</button>
                        <button className="btn-icon delete" onClick={() => handleDelete(todo.id)} title="Delete">🗑</button>
                      </div>
                    </div>

                    {todo.deadline_date && (
                      <div className="todo-deadline">
                        <span>📅 {todo.deadline_date}</span>
                        {todo.deadline_time && <span>⏰ {todo.deadline_time.slice(0,5)}</span>}
                      </div>
                    )}

                    {todo.subtasks && todo.subtasks.length > 0 && (
                      <div className="subtasks-list">
                        {todo.subtasks.map(subtask => (
                          <div key={subtask.id} className="subtask-item">
                            <input
                              type="checkbox"
                              checked={subtask.completed}
                              onChange={() => toggleSubtaskOnCard(todo, subtask.id)}
                            />
                            <span className={subtask.completed ? 'done' : ''}>{subtask.title}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="todo-card-footer">
                      <div className="todo-tags">
                        {todo.tags && todo.tags.split(',').map((tag, i) => (
                          <span key={i} className="todo-tag">#{tag.trim()}</span>
                        ))}
                      </div>
                      <button
                        className={`btn-complete ${todo.completed ? 'done' : ''}`}
                        onClick={() => handleToggleComplete(todo)}
                        title={todo.completed ? 'Mark pending' : 'Mark complete'}
                      >✓</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ─── Modal ──────────────────────────────────────────────────────── */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editTodo ? 'Edit Task' : 'Add New Task'}</h2>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleFormChange}
                  placeholder="Enter task title"
                  required
                />
              </div>

              <div className="form-group">
                <label>Priority *</label>
                <select name="priority" value={formData.priority} onChange={handleFormChange}>
                  <option value="1">Low Priority</option>
                  <option value="2">Medium Priority</option>
                  <option value="3">High Priority</option>
                </select>
              </div>

              <div className="form-group">
                <label>Tags</label>
                <select name="tags" value={formData.tags} onChange={handleFormChange}>
                  <option value="">Select a tag...</option>
                  {availableTags.map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
              </div>

              {/* Subtasks */}
              <div className="subtask-section">
                <div className="subtask-section-header">
                  <span>Subtasks</span>
                  <button type="button" className="add-subtask-btn" onClick={addSubtask}>
                    + Add Step
                  </button>
                </div>
                {formData.subtasks.length === 0 ? (
                  <p className="no-subtasks-text">No subtasks added.</p>
                ) : (
                  formData.subtasks.map(subtask => (
                    <div key={subtask.id} className="subtask-input-row">
                      <input
                        type="checkbox"
                        className="subtask-checkbox"
                        checked={subtask.completed}
                        onChange={() => toggleSubtaskInModal(subtask.id)}
                      />
                      <input
                        type="text"
                        className={subtask.completed ? 'done-input' : ''}
                        value={subtask.title}
                        onChange={(e) => updateSubtaskTitle(subtask.id, e.target.value)}
                        placeholder="Subtask title"
                      />
                      <button
                        type="button"
                        className="subtask-delete-btn"
                        onClick={() => removeSubtask(subtask.id)}
                      >🗑</button>
                    </div>
                  ))
                )}
              </div>

              <div className="modal-form-row">
                <div className="form-group">
                  <label>Deadline Date *</label>
                  <input
                    type="date"
                    name="deadline_date"
                    value={formData.deadline_date}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Deadline Time *</label>
                  <input
                    type="time"
                    name="deadline_time"
                    value={formData.deadline_time}
                    onChange={handleFormChange}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="modal-submit-btn" disabled={submitting}>
                {submitting ? 'Saving...' : editTodo ? 'Update Task' : 'Create Task'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default Dashboard;