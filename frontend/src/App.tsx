import { useState, useEffect } from 'react';
import { itemService } from './services/itemService';
import { ItemList } from './components/ItemList';
import './App.css';

function App() {
  const [backendStatus, setBackendStatus] = useState<string>('');

  useEffect(() => {
    checkBackendHealth();
  }, []);

  const checkBackendHealth = async () => {
    try {
      const health = await itemService.checkHealth();
      setBackendStatus(health.message);
    } catch (error) {
      setBackendStatus('Backend not connected');
    }
  };

  return (
    <div className="App">
      <header style={{ padding: '20px', backgroundColor: '#282c34', color: 'white' }}>
        <h1>Full Stack App - React + Spring Boot + Supabase</h1>
        <p style={{ fontSize: '14px', marginTop: '10px' }}>
          Backend Status: <span style={{ color: backendStatus.includes('running') ? '#4caf50' : '#ff9800' }}>{backendStatus}</span>
        </p>
      </header>
      
      <main>
        <ItemList />
      </main>

      <footer style={{ padding: '20px', textAlign: 'center', borderTop: '1px solid #ddd', marginTop: '40px' }}>
        <p>Full Stack Application Framework</p>
        <p style={{ fontSize: '12px', color: '#666' }}>
          React Frontend • Spring Boot Backend • Supabase Database
        </p>
      </footer>
    </div>
  );
}

export default App;
