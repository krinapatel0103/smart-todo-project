// Register.jsx
// Purpose: Register page - creates new user account via FastAPI.

import React, {useState} from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
// import { hashPassword } from '../utils/hashPassword';
import '../styles/Auth.css';

function Register() {
    const [formData, setFormData] = useState({
        username : "",
        email : "",
        password : "",
        confirm_password : "",
    });

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    // ------ Handle Input change --------
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // ----Handle Submit ----
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        // Client side password match check
        if (formData.password !== formData.confirm_password) {
            setError('Passwords do not match!');
            setLoading(false);
            return;
        }

        try {
        // const hashedPassword = await hashPassword(formData.password);
        // const hashedConfirmPassword = await hashPassword(formData.confirm_password);

        await axiosInstance.post('/auth/register', {
            username         : formData.username,
            email            : formData.email,
            password         : formData.password,
            confirm_password : formData.confirm_password,
            // password         : hashedPassword,
            // confirm_password : hashedConfirmPassword,
        });

        setSuccess('Account created! redirecting to login...');

        // 2 second baad login pe redirect karo
        setTimeout(() => {
            navigate('/login');
        }, 2000);

      } catch (err) {

        const detail = err.response?.data?.detail;
        if (Array.isArray(detail)) {
            setError(detail.map(d => d.msg).join(', '));
        } else {
            setError(detail || 'Registration failed. Try again.');
        }
     } finally {
        setLoading(false);
     }
    };

  return (
    <div className = "auth-container">
        <div className = "auth-card">

            <div className = "auth-header">
                <h1>Smart Todo </h1>
                <p>Create Your account</p>
            </div>

            {error && <div className = "auth-error">{error}</div>}
            {success && <div className = "auth-success">{success}</div>}

            <form onSubmit = {handleSubmit} className = "auth-form">

                <div className = "form-group">
                    <label>Username</label>

                    <input
                        type = "text"
                        name = "username"
                        value = {formData.username}
                        onChange = {handleChange}
                        placeholder = "Enter Username"
                        required
                    />
                </div>

                <div className = "form-group">
                    <label>Email</label>

                    <input
                        type = "email"
                        name = "email"
                        value = {formData.email}
                        onChange = {handleChange}
                        placeholder = "Enter email"
                        required
                    />
                </div>

                <div className = "form-group">
                    <label>Password</label>

                    <input
                        type = "password"
                        name = "password"
                        value = {formData.password}
                        onChange = {handleChange}
                        placeholder = "Enter password"
                        required
                    />
                </div>

                <div className = "form-group">
                    <label>Confirm Password</label>

                    <input
                        type = "password"
                        name = "confirm_password"
                        value = {formData.confirm_password}
                        onChange = {handleChange}
                        placeholder = "Confirm Your password"
                        required
                    />
                </div>

                <button type = "submit" className = "auth-btn" disabled = {loading}>
                    {loading ? 'Creating account...' : "Register"}
                </button>

            </form>

            <p className = "auth-link">
                Already have an account? <Link to = "/login">Login</Link>
            </p>

        </div>
    </div>
  );

}

export default Register;