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
      <IonHeader>
        <IonToolbar>
          <IonTitle>{t('auth.reset.title')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <form onSubmit={handleResetPassword}>
          <p className="ion-padding-horizontal">{t('auth.reset.instruction')}</p>
          <IonItem>
            <IonLabel position="floating">{t('auth.reset.newPassword')}</IonLabel>
            <IonInput type="password" value={newPassword} onIonInput={e => setNewPassword(e.detail.value!)} required />
          </IonItem>
          
          <IonItem>
            <IonLabel position="floating">{t('auth.reset.confirmPassword')}</IonLabel>
            <IonInput type="password" value={confirmPassword} onIonInput={e => setConfirmPassword(e.detail.value!)} required />
          </IonItem>
          
          {error && (
            <IonText color="danger" className="ion-padding">
              <p>{error}</p>
            </IonText>
          )}

          {message && (
            <IonText color="success" className="ion-padding">
              <p>{message}</p>
              <p>{t('auth.reset.redirecting')}</p>
            </IonText>
          )}

          <IonButton expand="block" type="submit" className="ion-margin-top" disabled={loading || !token}>
            {loading ? <IonSpinner name="crescent" /> : t('auth.reset.submit')}
          </IonButton>
          
          <div className="ion-text-center ion-margin-top">
            <p><Link to="/login">{t('auth.reset.backToLogin')}</Link></p>
          </div>
        </form>
      </IonContent>
    </IonPage>
  );
};

export default ResetPassword;
