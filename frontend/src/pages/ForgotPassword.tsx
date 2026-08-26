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
      <IonHeader>
        <IonToolbar>
          <IonTitle>{t('auth.forgot.title')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <form onSubmit={handleRequestReset}>
          <p className="ion-padding-horizontal">{t('auth.forgot.instruction')}</p>
          <IonItem>
            <IonLabel position="floating">{t('auth.forgot.email')}</IonLabel>
            <IonInput type="email" value={email} onIonInput={e => setEmail(e.detail.value!)} required />
          </IonItem>
          
          {error && (
            <IonText color="danger" className="ion-padding">
              <p>{error}</p>
            </IonText>
          )}

          {message && (
            <IonText color="success" className="ion-padding">
              <p>{message}</p>
            </IonText>
          )}

          <IonButton expand="block" type="submit" className="ion-margin-top" disabled={loading}>
            {loading ? <IonSpinner name="crescent" /> : t('auth.forgot.submit')}
          </IonButton>
          
          <div className="ion-text-center ion-margin-top">
            <p>{t('auth.forgot.remembered')} <Link to="/login">{t('auth.forgot.backToLogin')}</Link></p>
          </div>
        </form>
      </IonContent>
    </IonPage>
  );
};

export default ForgotPassword;
