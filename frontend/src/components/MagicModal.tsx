import React, { useState, useRef } from 'react';
import { IonModal, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons, IonTextarea, IonIcon, IonSpinner, IonItem } from '@ionic/react';
import { closeOutline, colorWandOutline, micOutline, stopCircleOutline } from 'ionicons/icons';
import { api } from '../services/api';
import { useTranslation, Trans } from 'react-i18next';

interface MagicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialText?: string;
}

const MagicModal: React.FC<MagicModalProps> = ({ isOpen, onClose, onSuccess, initialText }) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const { t } = useTranslation();
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  React.useEffect(() => {
    if (isOpen && initialText) {
      setText(initialText);
    }
  }, [isOpen, initialText]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        // Convert to base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64data = (reader.result as string).split(',')[1];
          await submitToApi({ audioBase64: base64data, mimeType: mimeType });
        };
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('No se pudo acceder al micrófono. Asegúrate de dar los permisos.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSubmitText = () => {
    if (!text.trim()) return;
    submitToApi({ text });
  };

  const submitToApi = async (payload: { text?: string; audioBase64?: string; mimeType?: string }) => {
    setLoading(true);
    try {
      const res = await api.post('/transactions/magic', payload);
      alert(`¡Mágicamente guardado!\n${res.type === 'expense' ? 'Gasto' : 'Ingreso'} de $${res.amount}\nCategoría: ${res._magic_category_name}\nCuenta: ${res._magic_account_name}`);
      setText('');
      onSuccess();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error al procesar la solicitud con IA');
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose} className="glass-modal" initialBreakpoint={0.65} breakpoints={[0, 0.65, 0.9]}>
      <IonHeader className="ion-no-border">
        <IonToolbar style={{ '--background': 'transparent' }}>
          <IonTitle style={{ fontWeight: 700 }}>Magic Add ✨</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose}>
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          <p style={{ color: 'var(--ion-color-medium)', fontSize: '14px', margin: '0 0 16px 0' }}>
            <Trans i18nKey="magicModal.instruction">
              Escribe tu gasto o <strong>mantén presionado el micrófono</strong> para hablar.
            </Trans>
          </p>
          
          <IonItem lines="none" className="glass-input" style={{ marginBottom: '20px', borderRadius: '16px' }}>
            <IonTextarea
              placeholder={t('magicModal.placeholder')}
              value={text}
              onIonInput={e => setText(e.detail.value!)}
              rows={4}
              style={{ fontWeight: 500 }}
              disabled={isRecording || loading}
            />
          </IonItem>
          
          {text.trim() ? (
            <IonButton 
              expand="block" 
              shape="round"
              onClick={handleSubmitText} 
              disabled={loading} 
              style={{ height: '52px', '--background': 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)', fontWeight: 600, fontSize: '16px' }}
            >
              {loading ? <IonSpinner name="dots" color="light" /> : (
                <>
                  <IonIcon icon={colorWandOutline} slot="start" />
                  {t('magicModal.processing', 'Procesar Texto')}
                </>
              )}
            </IonButton>
          ) : (
            <IonButton 
              expand="block" 
              shape="round"
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              disabled={loading} 
              style={{ 
                height: '60px', 
                '--background': isRecording ? 'var(--ion-color-danger)' : 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                transition: 'all 0.3s ease',
                fontWeight: 600,
                fontSize: '16px'
              }}
            >
              {loading ? <IonSpinner name="dots" color="light" /> : (
                <>
                  <IonIcon icon={isRecording ? stopCircleOutline : micOutline} slot="start" style={{ fontSize: '24px' }} />
                  {isRecording ? 'Suelta para enviar...' : 'Mantén presionado para hablar'}
                </>
              )}
            </IonButton>
          )}
        </div>
      </IonContent>
    </IonModal>
  );
};

export default MagicModal;
