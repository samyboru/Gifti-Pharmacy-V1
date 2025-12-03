// File Location: client/src/pages/CreateNewPasswordPage.tsx

import { useState, useEffect } from 'react';
// --- THIS IS THE FIX: Removed 'Link' from the import ---
import { useLocation, useNavigate } from 'react-router-dom'; 
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import AuthFormContainer from '../components/common/AuthFormContainer';

const CreateNewPasswordPage = () => {
    const { t } = useTranslation();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const { username, token } = location.state || {};
    
    useEffect(() => {
        if (!username || !token) {
            navigate('/login');
        }
    }, [username, token, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError(t('createNewPasswordPage.errorMatch'));
            return;
        }
        setLoading(true);
        setError(null);
        try {
            await api.post('/auth/reset-password', { username, token, newPassword: password });
            
            navigate('/password-reset-success');

        } catch (err: any) {
            setError(err.response?.data?.msg || t('createNewPasswordPage.errorReset'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthFormContainer
            title={t('createNewPasswordPage.title')}
            subtitle={t('createNewPasswordPage.description')}
        >
            <form onSubmit={handleSubmit}>
                {error && <div className="login-error">{error}</div>}

                <div className="form-group">
                    <label htmlFor="password">{t('createNewPasswordPage.newPasswordLabel')}</label>
                    <input 
                      id="password" 
                      type="password" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      required 
                      onInvalid={e => (e.target as HTMLInputElement).setCustomValidity(t('formValidation.required'))}
                      onInput={e => (e.target as HTMLInputElement).setCustomValidity('')}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="confirmPassword">{t('createNewPasswordPage.confirmPasswordLabel')}</label>
                    <input 
                      id="confirmPassword" 
                      type="password" 
                      value={confirmPassword} 
                      onChange={(e) => setConfirmPassword(e.target.value)} 
                      required
                      onInvalid={e => (e.target as HTMLInputElement).setCustomValidity(t('formValidation.required'))}
                      onInput={e => (e.target as HTMLInputElement).setCustomValidity('')}
                    />
                </div>
                
                <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
                    {loading ? t('common.saving') : t('createNewPasswordPage.resetButton')}
                </button>
            </form>
        </AuthFormContainer>
    );
};

export default CreateNewPasswordPage;