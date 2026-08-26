import React, { useState } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonInput, IonButton, IonItem, IonLabel, IonText, IonSpinner } from '@ionic/react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useHistory, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const history = useHistory();
  const { t } = useTranslation();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const response = await api.post('/auth/register', { name, email, password });
      login(response.token, response.user);
      history.push('/app/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{t('auth.register.title')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <form onSubmit={handleRegister}>
          <IonItem>
            <IonLabel position="floating">{t('auth.register.name')}</IonLabel>
            <IonInput type="text" value={name} onIonInput={e => setName(e.detail.value!)} required />
          </IonItem>
          <IonItem>
            <IonLabel position="floating">{t('auth.register.email')}</IonLabel>
            <IonInput type="email" value={email} onIonInput={e => setEmail(e.detail.value!)} required />
          </IonItem>
          <IonItem>
            <IonLabel position="floating">{t('auth.register.password')}</IonLabel>
            <IonInput type="password" value={password} onIonInput={e => setPassword(e.detail.value!)} required />
          </IonItem>
          
          {error && (
            <IonText color="danger" className="ion-padding">
              <p>{error}</p>
            </IonText>
          )}

          <IonButton expand="block" type="submit" className="ion-margin-top" disabled={loading}>
            {loading ? <IonSpinner name="crescent" /> : t('auth.register.submit')}
          </IonButton>
          
          <div className="ion-text-center ion-margin-top">
            <p>{t('auth.register.hasAccount')} <Link to="/login">{t('auth.register.loginLink')}</Link></p>
          </div>
        </form>
      </IonContent>
    </IonPage>
  );
};

export default Register;
