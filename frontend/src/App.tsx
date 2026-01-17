import { useState, useEffect } from 'react';
import { authService } from './services/authService';
import { itemService } from './services/itemService';
import { AuthForm } from './components/AuthForm';
import { ItemList } from './components/ItemList';
import './App.css';

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [backendStatus, setBackendStatus] = useState<string>('');

  useEffect(() => {
    checkUser();
    checkBackendHealth();

    const { data: authListener } = authService.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkBackendHealth = async () => {
    try {
      const health = await itemService.checkHealth();
      setBackendStatus(health.message);
    } catch (error) {
      setBackendStatus('Backend not connected');
    }
  };

  const handleSignOut = async () => {
    try {
      await authService.signOut();
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div className="App">
      <header style={{ padding: '20px', backgroundColor: '#282c34', color: 'white' }}>
        <h1>Full Stack App - React + Spring Boot + Supabase</h1>
        <p style={{ fontSize: '14px', marginTop: '10px' }}>
          Backend Status: <span style={{ color: backendStatus.includes('running') ? '#4caf50' : '#ff9800' }}>{backendStatus}</span>
        </p>
        {user && (
          <div style={{ marginTop: '10px' }}>
            <span>Logged in as: {user.email}</span>
            <button
              onClick={handleSignOut}
              style={{ marginLeft: '15px', padding: '5px 15px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Sign Out
            </button>
          </div>
        )}
      </header>
      
      <main>
        {!user ? (
          <AuthForm onAuthSuccess={checkUser} />
        ) : (
          <ItemList />
        )}
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
