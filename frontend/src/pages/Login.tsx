import React, { useState } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonInput, IonButton, IonItem, IonLabel, IonText, IonSpinner } from '@ionic/react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useHistory, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const history = useHistory();
  const { t } = useTranslation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const response = await api.post('/auth/login', { email, password });
      login(response.token, response.user);
      history.push('/app/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{t('auth.login.title')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <form onSubmit={handleLogin}>
          <IonItem>
            <IonLabel position="floating">{t('auth.login.email')}</IonLabel>
            <IonInput type="email" value={email} onIonInput={e => setEmail(e.detail.value!)} required />
          </IonItem>
          <IonItem>
            <IonLabel position="floating">{t('auth.login.password')}</IonLabel>
            <IonInput type="password" value={password} onIonInput={e => setPassword(e.detail.value!)} required />
          </IonItem>
          
          {error && (
            <IonText color="danger" className="ion-padding">
              <p>{error}</p>
            </IonText>
          )}

          <IonButton expand="block" type="submit" className="ion-margin-top" disabled={loading}>
            {loading ? <IonSpinner name="crescent" /> : t('auth.login.submit')}
          </IonButton>

          <IonButton expand="block" color="light" className="ion-margin-top" onClick={() => alert('Google Auth not implemented yet')}>
            {t('auth.login.googleAuth')}
          </IonButton>
          
          <div className="ion-text-center ion-margin-top">
            <p><Link to="/forgot-password">{t('auth.login.forgotPassword')}</Link></p>
            <p>{t('auth.login.noAccount')} <Link to="/register">{t('auth.login.registerLink')}</Link></p>
          </div>
        </form>
      </IonContent>
    </IonPage>
  );
};

export default Login;
