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
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonTitle>{t('auth.login.title')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div className="auth-card-wrapper">
          <div className="glass-card ion-padding">
            <div className="ion-text-center ion-margin-bottom">
              <h1 className="text-gradient" style={{ fontWeight: 700, fontSize: '28px', margin: '10px 0 6px 0' }}>App Gastos</h1>
              <p style={{ color: 'var(--ion-color-medium, #94a3b8)', margin: 0, fontSize: '14px' }}>{t('auth.login.title')}</p>
            </div>

            <form onSubmit={handleLogin}>
              <IonItem className="glass-input" lines="none">
                <IonInput type="email" value={email} onIonInput={e => setEmail(e.detail.value!)} label={t('auth.login.email')} labelPlacement="floating" required />
              </IonItem>
              <IonItem className="glass-input" lines="none">
                <IonInput type="password" value={password} onIonInput={e => setPassword(e.detail.value!)} label={t('auth.login.password')} labelPlacement="floating" required />
              </IonItem>
              
              {error && (
                <IonText color="danger" className="ion-padding">
                  <p style={{ fontSize: '14px', margin: '4px 0' }}>{error}</p>
                </IonText>
              )}

              <IonButton expand="block" shape="round" type="submit" className="ion-margin-top" style={{ height: '50px', '--background': 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)', fontWeight: 600, fontSize: '16px' }} disabled={loading}>
                {loading ? <IonSpinner name="crescent" color="light" /> : t('auth.login.submit')}
              </IonButton>

              <IonButton expand="block" shape="round" fill="outline" color="medium" className="ion-margin-top" style={{ height: '44px', fontWeight: 500 }} onClick={() => alert('Google Auth not implemented yet')}>
                {t('auth.login.googleAuth')}
              </IonButton>
              
              <div className="ion-text-center ion-margin-top" style={{ fontSize: '14px', color: 'var(--ion-color-medium, #94a3b8)' }}>
                <p><Link to="/forgot-password" style={{ color: 'var(--ion-color-primary)', textDecoration: 'none' }}>{t('auth.login.forgotPassword')}</Link></p>
                <p>{t('auth.login.noAccount')} <Link to="/register" style={{ color: 'var(--ion-color-primary)', fontWeight: 600, textDecoration: 'none' }}>{t('auth.login.registerLink')}</Link></p>
              </div>
            </form>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;
