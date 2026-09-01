import React, { useState, useEffect } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonInput, IonButton, IonItem, IonLabel, IonText, IonSpinner } from '@ionic/react';
import { api } from '../services/api';
import { useLocation, useHistory, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const useQuery = () => {
  return new URLSearchParams(useLocation().search);
};

const ResetPassword: React.FC = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  
  const query = useQuery();
  const token = query.get('token');
  const history = useHistory();

  useEffect(() => {
    if (!token) {
      setError(t('auth.reset.invalidToken'));
    }
  }, [token, t]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    if (!token) {
      setError(t('auth.reset.invalidToken'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('auth.reset.passwordsDontMatch'));
      return;
    }

    setLoading(true);
    
    try {
      const response = await api.post('/auth/reset-password', { token, newPassword });
      setMessage(response.message || 'Password successfully reset.');
      setTimeout(() => history.push('/login'), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonTitle>{t('auth.reset.title')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div className="auth-card-wrapper">
          <div className="glass-card ion-padding">
            <div className="ion-text-center ion-margin-bottom">
              <h1 className="text-gradient" style={{ fontWeight: 700, fontSize: '26px', margin: '10px 0 6px 0' }}>{t('auth.reset.title')}</h1>
              <p style={{ color: 'var(--ion-color-medium, #94a3b8)', margin: 0, fontSize: '14px' }}>{t('auth.reset.instruction')}</p>
            </div>

            <form onSubmit={handleResetPassword}>
              <IonItem className="glass-input" lines="none">
                <IonInput type="password" value={newPassword} onIonInput={e => setNewPassword(e.detail.value!)} label={t('auth.reset.newPassword')} labelPlacement="floating" required />
              </IonItem>
              
              <IonItem className="glass-input" lines="none">
                <IonInput type="password" value={confirmPassword} onIonInput={e => setConfirmPassword(e.detail.value!)} label={t('auth.reset.confirmPassword')} labelPlacement="floating" required />
              </IonItem>
              
              {error && (
                <IonText color="danger" className="ion-padding">
                  <p style={{ fontSize: '14px', margin: '4px 0' }}>{error}</p>
                </IonText>
              )}

              {message && (
                <IonText color="success" className="ion-padding">
                  <p style={{ fontSize: '14px', margin: '4px 0' }}>{message}</p>
                  <p style={{ fontSize: '12px', color: 'var(--ion-color-medium)' }}>{t('auth.reset.redirecting')}</p>
                </IonText>
              )}

              <IonButton expand="block" shape="round" type="submit" className="ion-margin-top" style={{ height: '50px', '--background': 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)', fontWeight: 600, fontSize: '16px' }} disabled={loading || !token}>
                {loading ? <IonSpinner name="crescent" color="light" /> : t('auth.reset.submit')}
              </IonButton>
              
              <div className="ion-text-center ion-margin-top" style={{ fontSize: '14px', color: 'var(--ion-color-medium, #94a3b8)' }}>
                <p><Link to="/login" style={{ color: 'var(--ion-color-primary)', fontWeight: 600, textDecoration: 'none' }}>{t('auth.reset.backToLogin')}</Link></p>
              </div>
            </form>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ResetPassword;
