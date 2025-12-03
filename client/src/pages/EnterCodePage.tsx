// File Location: client/src/pages/EnterCodePage.tsx

import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import AuthFormContainer from '../components/common/AuthFormContainer';

const EnterCodePage = () => {
  const { t } = useTranslation();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(30);
  const navigate = useNavigate();
  const location = useLocation();
  
  const { username, maskedEmail, maskedPhone, method } = location.state || {};
  const destination = method === 'email' ? maskedEmail : maskedPhone;

  // --- ADD THIS RANDOM BACKGROUND LOGIC ---
  const [bgImage] = useState(() => {
    const images = [
      '/images/login-background.PNG', 
      '/images/login-background-1.jpg', 
      '/images/login-background-2.jpg',
      '/images/login-background-3.jpg',
       '/images/login-background-4.jpg', 
       '/images/login-background-5.jpg',
      '/images/login-background-6.jpg', 
      '/images/login-background-7.jpg', 
      '/images/login-background-8.jpg',
      '/images/login-background-9.jpg', 
      '/images/login-background-10.jpg', 
      '/images/login-background-11.jpg',
      '/images/login-background-12.jpg', 
      '/images/login-background-13.jpg', 
      '/images/login-background-14.jpg',
      '/images/login-background-15.jpg',
    ];
    const randomIndex = Math.floor(Math.random() * images.length);
    return images[randomIndex];
  });

  useEffect(() => {
    if (!username) {
      navigate('/reset-password');
      return;
    }
    const interval = setInterval(() => {
      setTimer(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [username, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.post('/auth/verify-token', { username, token: code });
      navigate('/create-new-password', { state: { username, token: code } });
    } catch (err: any) {
        setError(err.response?.data?.msg || t('resetPasswordPage.error'));
    } finally {
        setLoading(false);
    }
  };

  const handleResend = () => { 
    setTimer(30); 
    // You would typically add an API call here to actually resend the token
  };

  return (
    <div className="login-page-fullscreen" style={{ backgroundImage: `url('${bgImage}')` }}>
      <AuthFormContainer
        title={t('enterCodePage.title')}
        subtitle={t('enterCodePage.description', { destination })}
      >
        <form onSubmit={handleSubmit}>
          {error && <div className="login-error">{error}</div>}
          <div className="form-group">
            <label htmlFor="code">{t('enterCodePage.codeLabel')}</label>
            <input 
              id="code" type="text" value={code} onChange={(e) => setCode(e.target.value)} 
              required onInvalid={e => (e.target as HTMLInputElement).setCustomValidity(t('formValidation.required'))}
              onInput={e => (e.target as HTMLInputElement).setCustomValidity('')}
            />
          </div>
          <div className="resend-container" style={{ textAlign: 'right', marginBottom: '1rem', fontSize: '0.9rem' }}>
            {timer > 0 ? (
                <span style={{ color: 'var(--text-secondary)' }}>{t('enterCodePage.resendTimer', { timer })}</span>
            ) : (
                <button type="button" className="btn-link" onClick={handleResend}>{t('enterCodePage.resend')}</button>
            )}
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? t('enterCodePage.verifying') : t('enterCodePage.verifyButton')}
          </button>
          <Link to="/login" className="back-link">
            &laquo; {t('resetPasswordPage.backToLogin')}
          </Link>
        </form>
      </AuthFormContainer>
    </div>
  );
};

export default EnterCodePage;