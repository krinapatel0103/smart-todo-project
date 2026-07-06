import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import '../styles/Settings.css';
import '../styles/Dashboard.css';

function Settings() {
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [darkMode,     setDarkMode]     = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [saved,        setSaved]        = useState(false);

  const navigate      = useNavigate();
  const username      = localStorage.getItem('username') || '';
  const avatarLetters = username.slice(0, 2).toUpperCase();

  useEffect(() => {
    const notif = localStorage.getItem('notificationsEnabled');
    if (notif === 'false') setNotifEnabled(false);

    const dark = localStorage.getItem('darkMode');
    if (dark === 'true') setDarkMode(true);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      // Backend mein save karo
      await axiosInstance.patch('/auth/settings', {
        notifications_enabled: notifEnabled,
      });
      // localStorage mein bhi save karo
      localStorage.setItem('notificationsEnabled', notifEnabled);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Settings save failed', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDarkToggle = () => {
    const newVal = !darkMode;
    setDarkMode(newVal);
    localStorage.setItem('darkMode', newVal);
    document.body.classList.toggle('dark', newVal);
  };

  return (
    <div className="settings-container">

      {/* Navbar */}
      <nav className="settings-navbar">
        <div className="settings-navbar-left">
          <button className="back-btn" onClick={() => navigate('/dashboard')}>←</button>
          <div className="settings-brand">
            <div className="settings-brand-icon">⚙️</div>
            Settings
          </div>
        </div>
        <div className="navbar-right">
          <div className="navbar-avatar">{avatarLetters}</div>
          <span className="navbar-welcome">Welcome, {username}</span>
        </div>
      </nav>

      <div className="settings-content">

        <div className="settings-title-section">
          <h1>Settings</h1>
          <p>Manage your preferences</p>
        </div>

        {/* Notification Controls */}
        <div className="settings-card">
          <h3>Notification Controls</h3>
          <p>Manage how and when you receive task alerts</p>

          <div className="settings-row">
            <div className="settings-row-left">
              <h4>Auto-Show Alerts on Dashboard</h4>
              <p>Automatically show notification popup when overdue or due-soon tasks exist</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={notifEnabled}
                onChange={() => setNotifEnabled(!notifEnabled)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        {/* Appearance */}
        <div className="settings-card">
          <h3>Appearance</h3>
          <p>Customize the look of your dashboard</p>

          <div className="settings-row">
            <div className="settings-row-left">
              <h4>Dark Mode</h4>
              <p>Switch between light and dark theme</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={darkMode}
                onChange={handleDarkToggle}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        {/* Account Info */}
        <div className="settings-card">
          <h3>Account</h3>
          <p>Your account information</p>

          <div className="settings-row">
            <div className="settings-row-left">
              <h4>Username</h4>
              <p>{username}</p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button className="save-btn" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
        {saved && <span className="save-success">✅ Settings saved!</span>}

      </div>
    </div>
  );
}

export default Settings;