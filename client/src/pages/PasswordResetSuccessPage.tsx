// File Location: client/src/pages/PasswordResetSuccessPage.tsx

import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
// --- THIS IS THE FIX: Importing a reliable icon from the 'md' (Material Design) pack ---
import { MdCheckCircle } from 'react-icons/md'; 
import AuthFormContainer from '../components/common/AuthFormContainer';

const PasswordResetSuccessPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/login');
    }, 5000);
    return () => clearTimeout(timer);
  }, [navigate]);

   return (
    <AuthFormContainer title="" subtitle="">
      <div className="text-center">
        <div className="success-icon-container">
            {/* --- THIS IS THE FIX: Using the correct icon from 'md' --- */}
            <MdCheckCircle size={50} className="success-icon" />
        </div>
        <h2 className="auth-title" style={{ marginTop: '1rem' }}>
          {t('passwordResetSuccessPage.title', 'Password Reset Successfully!')}
        </h2>
        <p className="auth-subtitle">
          {t('passwordResetSuccessPage.description', 'You can now log in with your new password.')}
        </p>
        <Link to="/login" className="btn btn-primary" style={{ width: '100%', textDecoration: 'none', marginTop: '1rem' }}>
          {t('passwordResetSuccessPage.loginNow', 'Login Now')}
        </Link>
      </div>
    </AuthFormContainer>
  );
};

export default PasswordResetSuccessPage;