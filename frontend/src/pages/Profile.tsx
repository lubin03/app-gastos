import React, { useState } from 'react';
import { IonContent, IonPage, IonItem, IonLabel, IonInput, IonButton, IonSpinner, IonToast, IonSelect, IonSelectOption, useIonAlert, IonToggle } from '@ionic/react';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';
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
  const [presentAlert] = useIonAlert();

  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);

  React.useEffect(() => {
    const checkBiometrics = async () => {
      try {
        const result = await NativeBiometric.isAvailable();
        if (result.isAvailable) {
          setBiometricsAvailable(true);
          const saved = await NativeBiometric.isCredentialsSaved({ server: 'app-gastos' });
          setBiometricsEnabled(saved.isSaved);
        }
      } catch (e) {
        console.error('Biometrics not available', e);
      }
    };
    checkBiometrics();
  }, []);

  const handleBiometricToggle = async (e: any) => {
    const isChecked = e.detail.checked;
    if (isChecked === biometricsEnabled) return;

    if (isChecked) {
      if (!email || !currentPassword) {
        setToast({ show: true, message: 'Para activar la huella, primero ingresá tu correo y contraseña actual arriba.', color: 'warning' });
        setTimeout(() => e.target.checked = false, 50);
        return;
      }
      try {
        await NativeBiometric.verifyIdentity({
          reason: 'Verificá tu identidad para activar el inicio de sesión con huella',
          title: 'Activar Huella'
        });
        await NativeBiometric.setCredentials({
          username: email,
          password: currentPassword,
          server: 'app-gastos'
        });
        setBiometricsEnabled(true);
        setToast({ show: true, message: 'Huella activada correctamente', color: 'success' });
      } catch (err: any) {
        setTimeout(() => e.target.checked = false, 50);
        if (err.code !== 16 && err.code !== 15) {
           setToast({ show: true, message: 'Error al activar la huella', color: 'danger' });
        }
      }
    } else {
      try {
        await NativeBiometric.deleteCredentials({ server: 'app-gastos' });
        setBiometricsEnabled(false);
        setToast({ show: true, message: 'Huella desactivada', color: 'medium' });
      } catch (err) {
        setToast({ show: true, message: 'Error al desactivar la huella', color: 'danger' });
      }
    }
  };

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

  const handleDeleteAllTransactions = () => {
    presentAlert({
      header: '¡Cuidado!',
      message: 'Vas a borrar TODOS tus datos (cuentas, transacciones, categorías, presupuestos, etc). Esta acción NO se puede deshacer ni recuperar. ¿Estás absolutamente seguro?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Sí, borrar todo',
          role: 'destructive',
          handler: async () => {
            try {
              setLoading(true);
              await api.delete('/transactions/all');
              setToast({ show: true, message: 'Todos tus datos fueron eliminados.', color: 'success' });
            } catch (err: any) {
              setToast({ show: true, message: 'Error al eliminar los datos.', color: 'danger' });
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    });
  };

  return (
    <IonPage>
      <Header title={t('profile.title')} />
      <IonContent className="ion-padding">
        <div className="app-container" style={{ maxWidth: '600px' }}>
          <div className="glass-card ion-padding ion-margin-bottom">
            <h2 style={{ marginTop: 0, fontWeight: 700, fontSize: '1.2rem' }}>{t('profile.accountDetails')}</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '20px' }}>
              {t('profile.instruction')}
            </p>

            <IonItem className="glass-input" lines="none">
              <IonInput 
                type="email" 
                value={email} 
                onIonInput={e => setEmail(e.detail.value!)} 
                label={t('profile.email')}
                labelPlacement="floating"
              />
            </IonItem>

            {!user?.isGoogle && (
              <>
                <IonItem className="glass-input" lines="none">
                  <IonInput 
                    type="password" 
                    value={currentPassword} 
                    onIonInput={e => setCurrentPassword(e.detail.value!)} 
                    label={t('profile.currentPassword')}
                    labelPlacement="floating"
                    placeholder={t('profile.currentPasswordPlaceholder')}
                  />
                </IonItem>

                <IonItem className="glass-input" lines="none">
                  <IonInput 
                    type="password" 
                    value={newPassword} 
                    onIonInput={e => setNewPassword(e.detail.value!)} 
                    label={t('profile.newPassword')}
                    labelPlacement="floating"
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

            <IonItem className="glass-input" lines="none">
              <IonSelect 
                value={i18n.language.split('-')[0]} 
                onIonChange={e => i18n.changeLanguage(e.detail.value)}
                label={t('profile.language')}
                labelPlacement="floating"
              >
                <IonSelectOption value="en">{t('profile.english')}</IonSelectOption>
                <IonSelectOption value="es">{t('profile.spanish')}</IonSelectOption>
              </IonSelect>
            </IonItem>

            {biometricsAvailable && !user?.isGoogle && (
              <IonItem className="glass-input" lines="none" style={{ marginTop: '10px' }}>
                <IonLabel>{t('profile.enableBiometrics', 'Iniciar sesión con huella')}</IonLabel>
                <IonToggle 
                  checked={biometricsEnabled} 
                  onIonChange={handleBiometricToggle}
                  slot="end"
                />
              </IonItem>
            )}

            <IonButton 
              expand="block" 
              shape="round"
              className="ion-margin-top" 
              onClick={handleUpdate} 
              disabled={loading}
              style={{ height: '50px', '--background': 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)', fontWeight: 600, fontSize: '16px' }}
            >
              {loading ? <IonSpinner name="crescent" color="light" /> : t('profile.save')}
            </IonButton>
          </div>

          {/* Danger Zone */}
          <div className="glass-card ion-padding ion-margin-bottom" style={{ border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <h2 style={{ marginTop: 0, fontWeight: 700, fontSize: '1.2rem', color: 'var(--ion-color-danger)' }}>Zona de Peligro</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '20px' }}>
              Acciones destructivas para tu cuenta.
            </p>
            <IonButton 
              expand="block" 
              color="danger" 
              fill="outline"
              shape="round"
              onClick={handleDeleteAllTransactions}
              disabled={loading}
              style={{ height: '44px', fontWeight: 600 }}
            >
              Borrar todos mis datos
            </IonButton>
          </div>
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
