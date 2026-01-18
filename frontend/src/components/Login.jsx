import React, { useState } from 'react';
import axios from 'axios';

const Login = ({ setAuth }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isRegister, setIsRegister] = useState(false);
    const [userRole, setUserRole] = useState('user');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const endpoint = isRegister ? '/register' : '/token';
            const payload = isRegister 
                ? { username, password, role: userRole }
                : new FormData();
            
            if (!isRegister) {
                payload.append('username', username);
                payload.append('password', password);
            }

            const res = await axios.post(`http://localhost:8000${endpoint}`, payload);
            setAuth(res.data.access_token, res.data.role);
        } catch (err) {
            alert('Error: ' + (err.response?.data?.detail || err.message));
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h3>{isRegister ? 'Create Account' : 'Welcome Back'}</h3>
                <form onSubmit={handleSubmit} className="form-group">
                    <input 
                        placeholder="Username" 
                        value={username} 
                        onChange={e => setUsername(e.target.value)} 
                        required 
                    />
                    <input 
                        type="password" 
                        placeholder="Password" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        required 
                    />
                    
                    {isRegister && (
                        <select value={userRole} onChange={e => setUserRole(e.target.value)}>
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                    )}
                    
                    <button type="submit" className="btn-primary">
                        {isRegister ? 'Sign Up' : 'Sign In'}
                    </button>
                </form>
                <button 
                    onClick={() => setIsRegister(!isRegister)} 
                    className="btn-link"
                >
                    {isRegister ? 'Already have an account? Login' : 'Need an account? Register'}
                </button>
            </div>
        </div>
    );
};

export default Login;