// File Location: client/src/pages/ResetPasswordPage.tsx

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LuMail, LuPhone } from 'react-icons/lu';
import api from '../services/api';
import AuthFormContainer from '../components/common/AuthFormContainer';

const ResetPasswordPage = () => {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/forgot-password', { username });
      navigate('/enter-code', { 
        state: { 
          username, 
          maskedEmail: response.data.maskedEmail, 
          maskedPhone: response.data.maskedPhone,
          method 
        } 
      }); 
    } catch (err: any) {
        setError(err.response?.data?.msg || t('resetPasswordPage.error'));
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="login-page-fullscreen" style={{ backgroundImage: `url('${bgImage}')` }}>
      <AuthFormContainer
        title={t('resetPasswordPage.title')}
        subtitle={t('resetPasswordPage.description')}
      >
        <form onSubmit={handleSubmit}>
          {error && <div className="login-error">{error}</div>}
          <div className="form-group">
            <label htmlFor="username">{t('loginPage.usernameLabel')}</label>
            <input 
              id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} 
              required onInvalid={e => (e.target as HTMLInputElement).setCustomValidity(t('formValidation.required'))}
              onInput={e => (e.target as HTMLInputElement).setCustomValidity('')}
            />
          </div>
          <div className="form-group">
            <label>{t('resetPasswordPage.sendVia')}</label>
            <div className="choice-buttons">
                <button type="button" className={`choice-button ${method === 'email' ? 'active' : ''}`} onClick={() => setMethod('email')}>
                  <LuMail /> {t('resetPasswordPage.email')}
                </button>
                <button type="button" className={`choice-button ${method === 'phone' ? 'active' : ''}`} onClick={() => setMethod('phone')}>
                  <LuPhone /> {t('resetPasswordPage.phone')}
                </button>
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{width: '100%', marginTop: '1rem'}}>
            {loading ? t('resetPasswordPage.sending') : t('resetPasswordPage.sendButton')}
          </button>
          <Link to="/login" className="back-link">
            &laquo; {t('resetPasswordPage.backToLogin')}
          </Link>
        </form>
      </AuthFormContainer>
    </div>
  );
};

export default ResetPasswordPage;