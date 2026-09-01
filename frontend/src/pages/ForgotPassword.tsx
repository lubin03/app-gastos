import React, { useState } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonInput, IonButton, IonItem, IonLabel, IonText, IonSpinner } from '@ionic/react';
import { api } from '../services/api';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    
    try {
      const response = await api.post('/auth/forgot-password', { email });
      setMessage(response.message || 'Request sent.');
    } catch (err: any) {
      setError(err.message || 'Failed to request password reset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonTitle>{t('auth.forgot.title')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div className="auth-card-wrapper">
          <div className="glass-card ion-padding">
            <div className="ion-text-center ion-margin-bottom">
              <h1 className="text-gradient" style={{ fontWeight: 700, fontSize: '26px', margin: '10px 0 6px 0' }}>{t('auth.forgot.title')}</h1>
              <p style={{ color: 'var(--ion-color-medium, #94a3b8)', margin: 0, fontSize: '14px' }}>{t('auth.forgot.instruction')}</p>
            </div>

            <form onSubmit={handleRequestReset}>
              <IonItem className="glass-input" lines="none">
                <IonInput type="email" value={email} onIonInput={e => setEmail(e.detail.value!)} label={t('auth.forgot.email')} labelPlacement="floating" required />
              </IonItem>
              
              {error && (
                <IonText color="danger" className="ion-padding">
                  <p style={{ fontSize: '14px', margin: '4px 0' }}>{error}</p>
                </IonText>
              )}

              {message && (
                <IonText color="success" className="ion-padding">
                  <p style={{ fontSize: '14px', margin: '4px 0' }}>{message}</p>
                </IonText>
              )}

              <IonButton expand="block" shape="round" type="submit" className="ion-margin-top" style={{ height: '50px', '--background': 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)', fontWeight: 600, fontSize: '16px' }} disabled={loading}>
                {loading ? <IonSpinner name="crescent" color="light" /> : t('auth.forgot.submit')}
              </IonButton>
              
              <div className="ion-text-center ion-margin-top" style={{ fontSize: '14px', color: 'var(--ion-color-medium, #94a3b8)' }}>
                <p>{t('auth.forgot.remembered')} <Link to="/login" style={{ color: 'var(--ion-color-primary)', fontWeight: 600, textDecoration: 'none' }}>{t('auth.forgot.backToLogin')}</Link></p>
              </div>
            </form>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ForgotPassword;
