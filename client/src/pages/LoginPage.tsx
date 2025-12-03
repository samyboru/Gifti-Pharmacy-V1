import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom'; 
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext'; // Fixed import path
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import LoadingScreen from '../components/common/LoadingScreen'; // Fixed import path

const LoginPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { login, isLoggingIn, user } = useAuth();

  // FIX: Redirect if already logged in (Handles Back Button behavior)
  useEffect(() => {
    if (user && !isLoggingIn) {
      navigate('/', { replace: true });
    }
  }, [user, isLoggingIn, navigate]);

  const [bgImage] = useState(() => {
    const images = [
      '/images/login-background.PNG', '/images/login-background-1.jpg',
      '/images/login-background-2.jpg', '/images/login-background-3.jpg',
      '/images/login-background-4.jpg', '/images/login-background-5.jpg',
      '/images/login-background-6.jpg', '/images/login-background-7.jpg',
      '/images/login-background-8.jpg', '/images/login-background-9.jpg',
      '/images/login-background-10.jpg', '/images/login-background-11.jpg',
      '/images/login-background-12.jpg', '/images/login-background-13.jpg',
      '/images/login-background-14.jpg', '/images/login-background-15.jpg',
    ];
    const randomIndex = Math.floor(Math.random() * images.length);
    return images[randomIndex];
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(username, password);
    } catch (err: any) {
      console.error("Login failed:", err); 
      setError(err.response?.data?.msg || t('loginPage.error'));
    }
  };

  if (isLoggingIn) {
    return <LoadingScreen message="Verifying credentials..." />;
  }

  // Prevent flashing login screen if we are about to redirect
  if (user) return null;

  return (
    <div 
      className="login-page-fullscreen" 
      style={{ backgroundImage: `url('${bgImage}')` }}
    >
      <div className="login-language-switcher">
        <LanguageSwitcher />
      </div>

      <div className="login-form-container">
        <h1 className="login-header">Gifty Pharmacy</h1>
        <p className="login-subheader">{t('loginPage.subtitle')}</p>
        <form className="login-form" onSubmit={handleLogin}>
          {error && <div className="login-error">{error}</div>}
          <div className="form-group">
            <label htmlFor="username">{t('loginPage.usernameLabel')}</label>
            <input 
              id="username" type="text" value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              autoComplete="username" required 
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">{t('loginPage.passwordLabel')}</label>
            <input 
              id="password" type="password" value={password} 
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password" required 
            />
          </div>
          <div className="forgot-password-container">
              <Link to="/reset-password" className="forgot-password-link">{t('loginPage.forgotPassword')}</Link>
          </div>
          <button type="submit" className="btn btn-primary login-btn" disabled={isLoggingIn}>
            {t('loginPage.button')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;