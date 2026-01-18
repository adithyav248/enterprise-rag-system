import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../config';

const Dashboard = ({ token, role }) => {
    const [file, setFile] = useState(null);
    const [query, setQuery] = useState('');
    const [messages, setMessages] = useState([
        { sender: 'bot', text: 'Hello! I am your Enterprise AI. Ask me anything about your uploaded documents.' }
    ]);
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleUpload = async () => {
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);

        try {
            setLoading(true);
            await axios.post(`${API_URL}/upload`, formData, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            alert('File uploaded successfully!');
            setFile(null);
        } catch (err) {
            alert('Upload failed: ' + (err.response?.data?.detail || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleChat = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        const newMsg = { sender: 'user', text: query };
        setMessages(prev => [...prev, newMsg]);
        setQuery('');
        
        try {
            const res = await axios.post(`${API_URL}/chat`, null, {
                params: { query: query },
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            setMessages(prev => [...prev, { 
                sender: 'bot', 
                text: res.data.answer,
                sources: res.data.sources 
            }]);
        } catch (err) {
            setMessages(prev => [...prev, { sender: 'bot', text: 'Sorry, I encountered an error retrieving the answer.' }]);
        }
    };

    return (
        <div className="dashboard-container">
            {/* Sidebar - Only visible for Admin */}
            {role === 'admin' && (
                <div className="sidebar">
                    <h3>Admin Panel</h3>
                    <div className="upload-section">
                        <p style={{marginBottom: '10px', fontSize: '0.9rem', color: '#64748b'}}>Upload Knowledge Base (PDF)</p>
                        <input 
                            type="file" 
                            onChange={e => setFile(e.target.files[0])} 
                            accept=".pdf" 
                            className="file-input"
                        />
                        <button 
                            onClick={handleUpload} 
                            disabled={loading} 
                            className="btn-primary" 
                            style={{width: '100%'}}
                        >
                            {loading ? 'Ingesting...' : 'Upload PDF'}
                        </button>
                    </div>
                </div>
            )}

            {/* Main Chat Area */}
            <div className="chat-area">
                <div className="messages-box">
                    {messages.map((msg, i) => (
                        <div key={i} className={`message ${msg.sender}`}>
                            <div>{msg.text}</div>
                            {msg.sources && msg.sources.length > 0 && (
                                <span className="source-tag">
                                    Source: {msg.sources[0].split('/').pop()}
                                </span>
                            )}
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
                
                <form onSubmit={handleChat} className="input-area">
                    <input 
                        value={query} 
                        onChange={e => setQuery(e.target.value)} 
                        placeholder="Type your question here..." 
                    />
                    <button type="submit" className="btn-primary">Send</button>
                </form>
            </div>
        </div>
    );
};

export default Dashboard;