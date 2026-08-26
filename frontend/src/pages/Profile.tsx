import React, { useState } from 'react';
import { IonContent, IonPage, IonItem, IonLabel, IonInput, IonButton, IonSpinner, IonToast, IonSelect, IonSelectOption } from '@ionic/react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import Header from '../components/Header';
import { useTranslation } from 'react-i18next';

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { t, i18n } = useTranslation();
  
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', color: 'success' });

  const handleUpdate = async () => {
    if (!email) {
      setToast({ show: true, message: 'Email is required', color: 'danger' });
      return;
    }

    if (!user?.isGoogle && !currentPassword) {
      setToast({ show: true, message: 'Current password is required to update profile', color: 'danger' });
      return;
    }

    setLoading(true);
    try {
      await api.put('/auth/profile', {
        newEmail: email,
        currentPassword: user?.isGoogle ? undefined : currentPassword,
        newPassword: user?.isGoogle ? undefined : newPassword || undefined
      });

      // Update context
      if (user) {
        updateUser({ ...user, email });
      }

      setToast({ show: true, message: 'Profile updated successfully!', color: 'success' });
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to update profile';
      setToast({ show: true, message: msg, color: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <Header title={t('profile.title')} />
      <IonContent className="ion-padding">
        <div className="glass-card ion-padding ion-margin-bottom">
          <h2 style={{ marginTop: 0, fontWeight: 700, fontSize: '1.2rem' }}>{t('profile.accountDetails')}</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '20px' }}>
            {t('profile.instruction')}
          </p>

          <IonItem className="glass-item ion-margin-bottom" lines="none">
            <IonLabel position="stacked">{t('profile.email')}</IonLabel>
            <IonInput 
              type="email" 
              value={email} 
              onIonInput={e => setEmail(e.detail.value!)} 
            />
          </IonItem>

          {!user?.isGoogle && (
            <>
              <IonItem className="glass-item ion-margin-bottom" lines="none">
                <IonLabel position="stacked">{t('profile.currentPassword')}</IonLabel>
                <IonInput 
                  type="password" 
                  value={currentPassword} 
                  onIonInput={e => setCurrentPassword(e.detail.value!)} 
                  placeholder={t('profile.currentPasswordPlaceholder')}
                />
              </IonItem>

              <IonItem className="glass-item ion-margin-bottom" lines="none">
                <IonLabel position="stacked">{t('profile.newPassword')}</IonLabel>
                <IonInput 
                  type="password" 
                  value={newPassword} 
                  onIonInput={e => setNewPassword(e.detail.value!)} 
                  placeholder={t('profile.newPasswordPlaceholder')}
                />
              </IonItem>
            </>
          )}

          {user?.isGoogle && (
            <p style={{ color: '#ec4899', fontSize: '0.85rem', marginTop: '10px' }}>
              {t('profile.googleWarning')}
            </p>
          )}

          <IonItem className="glass-item ion-margin-bottom" lines="none" style={{ marginTop: '20px' }}>
            <IonLabel position="stacked">{t('profile.language')}</IonLabel>
            <IonSelect 
              value={i18n.language.split('-')[0]} 
              onIonChange={e => i18n.changeLanguage(e.detail.value)}
            >
              <IonSelectOption value="en">{t('profile.english')}</IonSelectOption>
              <IonSelectOption value="es">{t('profile.spanish')}</IonSelectOption>
            </IonSelect>
          </IonItem>

          <IonButton 
            expand="block" 
            className="ion-margin-top" 
            onClick={handleUpdate} 
            disabled={loading}
            style={{ '--border-radius': '12px', '--background': 'var(--ion-color-primary)' }}
          >
            {loading ? <IonSpinner name="crescent" /> : t('profile.save')}
          </IonButton>
        </div>

        <IonToast
          isOpen={toast.show}
          onDidDismiss={() => setToast({ ...toast, show: false })}
          message={toast.message}
          duration={3000}
          color={toast.color}
          position="bottom"
        />
      </IonContent>
    </IonPage>
  );
};

export default Profile;
