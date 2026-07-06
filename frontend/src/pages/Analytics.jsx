import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import '../styles/Analytics.css';
import '../styles/Dashboard.css';

function Analytics() {
  const [todos,   setTodos]   = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const username      = localStorage.getItem('username') || '';
  const avatarLetters = username.slice(0, 2).toUpperCase();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const res = await axiosInstance.get('/todos/');
      setTodos(res.data);
    } catch (err) {
      if (err.response?.status === 401) navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  // ─── Stats Compute ───────────────────────────────────────────────────────────
  const total     = todos.length;
  const completed = todos.filter(t => t.completed).length;
  const pending   = total - completed;
  const highPri   = todos.filter(t => t.priority === 3).length;
  const rate      = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Tags count
  const tagCount = {};
  todos.forEach(todo => {
    if (todo.tags) {
      todo.tags.split(',').forEach(tag => {
        const t = tag.trim();
        if (t) tagCount[t] = (tagCount[t] || 0) + 1;
      });
    }
  });
  const tagEntries = Object.entries(tagCount).sort((a, b) => b[1] - a[1]);
  const maxTagCount = tagEntries.length > 0 ? Math.max(...tagEntries.map(e => e[1])) : 1;

  // ─── Donut Chart ─────────────────────────────────────────────────────────────
  const DonutChart = ({ completed, pending }) => {
    const total = completed + pending;
    if (total === 0) {
      return (
        <div className="donut-wrapper">
          <svg width="160" height="160" className="donut-svg">
            <circle cx="80" cy="80" r="60" fill="none" stroke="#e5e7eb" strokeWidth="20"/>
            <text x="80" y="86" textAnchor="middle" fontSize="20" fontWeight="800" fill="#9ca3af">0%</text>
          </svg>
        </div>
      );
    }

    const r = 60;
    const cx = 80;
    const cy = 80;
    const circumference = 2 * Math.PI * r;
    const completedDash = (completed / total) * circumference;
    const pendingDash   = (pending   / total) * circumference;

    return (
      <div className="donut-wrapper">
        <svg width="160" height="160" className="donut-svg">
          {/* Pending arc */}
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="20"
            strokeDasharray={`${pendingDash} ${circumference}`}
            strokeDashoffset={0}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
          {/* Completed arc */}
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke="#16a34a"
            strokeWidth="20"
            strokeDasharray={`${completedDash} ${circumference}`}
            strokeDashoffset={-pendingDash}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
          <text x={cx} y={cy - 8}  textAnchor="middle" fontSize="22" fontWeight="800" fill="#111827">{rate}%</text>
          <text x={cx} y={cy + 14} textAnchor="middle" fontSize="11" fill="#9ca3af">Complete</text>
        </svg>
        <div className="donut-legend">
          <div className="legend-item">
            <div className="legend-dot" style={{background:'#16a34a'}}></div>
            Completed
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{background:'#f59e0b'}}></div>
            Pending
          </div>
        </div>
      </div>
    );
  };

  // ─── Pie Chart ───────────────────────────────────────────────────────────────
  const PieChart = ({ todos }) => {
    const low    = todos.filter(t => t.priority === 1).length;
    const medium = todos.filter(t => t.priority === 2).length;
    const high   = todos.filter(t => t.priority === 3).length;
    const total  = low + medium + high;

    if (total === 0) {
      return (
        <svg width="160" height="160">
          <circle cx="80" cy="80" r="70" fill="#e5e7eb"/>
          <text x="80" y="86" textAnchor="middle" fontSize="13" fill="#9ca3af">No data</text>
        </svg>
      );
    }

    const colors = ['#2563eb', '#f59e0b', '#dc2626'];
    const values = [low, medium, high];
    const labels = ['Low', 'Medium', 'High'];
    let startAngle = -Math.PI / 2;
    const cx = 80; const cy = 80; const r = 70;

    const slices = values.map((val, i) => {
      const angle = (val / total) * 2 * Math.PI;
      const x1 = cx + r * Math.cos(startAngle);
      const y1 = cy + r * Math.sin(startAngle);
      const x2 = cx + r * Math.cos(startAngle + angle);
      const y2 = cy + r * Math.sin(startAngle + angle);
      const midAngle = startAngle + angle / 2;
      const lx = cx + (r + 20) * Math.cos(midAngle);
      const ly = cy + (r + 20) * Math.sin(midAngle);
      const largeArc = angle > Math.PI ? 1 : 0;
      const path = val > 0
        ? `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`
        : '';
      const slice = { path, color: colors[i], lx, ly, label: labels[i], pct: Math.round((val / total) * 100), val };
      startAngle += angle;
      return slice;
    });

    return (
      <div style={{display:'flex', justifyContent:'center'}}>
        <svg width="220" height="220" viewBox="-30 -20 280 260">
          {slices.map((s, i) => s.val > 0 && (
            <g key={i}>
              <path d={s.path} fill={s.color} opacity="0.9"/>
              <text x={s.lx} y={s.ly} textAnchor="middle" fontSize="11" fontWeight="600" fill={s.color}>
                {s.label} {s.pct}%
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  if (loading) return <div className="loading-screen">Loading analytics...</div>;

  return (
    <div className="analytics-container">

      {/* Navbar */}
      <nav className="analytics-navbar">
        <div className="analytics-navbar-left">
          <button className="back-btn" onClick={() => navigate('/dashboard')}>←</button>
          <div className="analytics-brand">
            <div className="analytics-brand-icon">📊</div>
            Analytics
          </div>
        </div>
        <div className="navbar-right">
          <div className="navbar-avatar">{avatarLetters}</div>
          <span className="navbar-welcome">Welcome, {username}</span>
        </div>
      </nav>

      <div className="analytics-content">

        {/* Title */}
        <div className="analytics-title-section">
          <h1>Performance Insights</h1>
          <p>Track your productivity metrics</p>
        </div>

        {/* Stats Cards */}
        <div className="analytics-stats">
          <div className="analytics-stat-card">
            <div className="a-stat-label">Total Tasks</div>
            <div className="a-stat-value blue">{total}</div>
          </div>
          <div className="analytics-stat-card">
            <div className="a-stat-label">Completed Rate</div>
            <div className="a-stat-value green">{rate}%</div>
          </div>
          <div className="analytics-stat-card">
            <div className="a-stat-label">High Priority</div>
            <div className="a-stat-value red">{highPri}</div>
          </div>
          <div className="analytics-stat-card">
            <div className="a-stat-label">Tags Used</div>
            <div className="a-stat-value">{tagEntries.length}</div>
          </div>
        </div>

        {/* Charts */}
        <div className="analytics-charts">
          <div className="chart-card">
            <h3>Task Completion</h3>
            <DonutChart completed={completed} pending={pending} />
          </div>
          <div className="chart-card">
            <h3>Priority Breakdown</h3>
            <PieChart todos={todos} />
          </div>
        </div>

        {/* Tags Bar Chart */}
        <div className="chart-card-full">
          <h3>Top Tags Activity</h3>
          {tagEntries.length === 0 ? (
            <p style={{color:'var(--text-muted)', fontSize:'13px', textAlign:'center', padding:'20px'}}>
              No tags found — add tags to your tasks!
            </p>
          ) : (
            <div className="tags-bar-chart">
              {tagEntries.map(([tag, count]) => (
                <div key={tag} className="tag-bar-group">
                  <div className="tag-bar-count">{count}</div>
                  <div
                    className="tag-bar"
                    style={{ height: `${(count / maxTagCount) * 120}px` }}
                  ></div>
                  <div className="tag-bar-label">{tag}</div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default Analytics;