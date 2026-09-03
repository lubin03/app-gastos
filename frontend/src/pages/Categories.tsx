import React, { useState } from 'react';
import { IonContent, IonPage, IonTitle, IonToolbar, IonList, IonItem, IonLabel, IonFab, IonFabButton, IonIcon, IonModal, IonButton, IonInput, IonSpinner, useIonViewWillEnter, IonSelect, IonSelectOption, IonHeader } from '@ionic/react';
import { add } from 'ionicons/icons';
import { api } from '../services/api';
import Header from '../components/Header';
import { useTranslation } from 'react-i18next';

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [type, setType] = useState('expense');
  const [parentId, setParentId] = useState('');
  const { t } = useTranslation();

  const loadCategories = async () => {
    try {
      const data = await api.get('/categories');
      setCategories(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useIonViewWillEnter(() => {
    loadCategories();
  });

  const handleCreate = async () => {
    if (!newName) return;
    try {
      await api.post('/categories', { name: newName, type, parent_id: parentId || null });
      setNewName('');
      setParentId('');
      setShowModal(false);
      loadCategories();
    } catch (err) {
      console.error(err);
    }
  };

  const parentCategories = categories.filter(c => !c.parent_id);

  return (
    <IonPage>
      <Header title={t('categories.title')} />
      <IonContent className="ion-padding-horizontal">
        <div className="app-container">
          {loading ? <IonSpinner className="ion-margin" /> : (
            <IonList style={{ background: 'transparent', paddingBottom: '80px' }}>
              {parentCategories.map(parent => (
                <React.Fragment key={parent.id}>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ion-color-medium, #94a3b8)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '20px', marginBottom: '8px', paddingLeft: '8px' }}>
                    {parent.name} ({t(`categories.${parent.type}`)})
                  </h3>
                  {categories.filter(c => c.parent_id === parent.id).map(child => (
                    <IonItem key={child.id} className="glass-item" lines="none">
                      <IonLabel className="ion-padding-start">
                        <h2 style={{ fontWeight: 600, color: 'var(--ion-text-color)' }}>- {child.name}</h2>
                        <p style={{ color: child.type === 'income' ? '#10b981' : '#f43f5e', textTransform: 'uppercase', fontSize: '10px', fontWeight: 600 }}>{t(`categories.${child.type}`)}</p>
                      </IonLabel>
                    </IonItem>
                  ))}
                </React.Fragment>
              ))}
              {categories.length === 0 && <div className="ion-padding ion-text-center" style={{ color: 'var(--ion-color-medium, #94a3b8)' }}>{t('common.noTransactions')}</div>}
            </IonList>
          )}
        </div>

        <IonFab vertical="bottom" horizontal="end" slot="fixed" style={{ marginBottom: '16px', marginRight: '8px' }}>
          <IonFabButton onClick={() => setShowModal(true)}>
              <IonIcon icon={add} />
            </IonFabButton>
          </IonFab>

          <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)} className="glass-modal">
            <IonHeader>
              <IonToolbar>
                <IonTitle>{t('categories.addCategory')}</IonTitle>
                <IonButton slot="end" fill="clear" onClick={() => setShowModal(false)}>{t('common.cancel')}</IonButton>
              </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
              <IonItem className="glass-input" lines="none">
                <IonInput value={newName} onIonInput={e => setNewName(e.detail.value!)} label={t('categories.name')} labelPlacement="floating" />
              </IonItem>
              
              <IonItem className="glass-input" lines="none">
                <IonSelect value={type} onIonChange={e => setType(e.detail.value)} label={t('categories.type')} labelPlacement="floating">
                  <IonSelectOption value="expense">{t('categories.expense')}</IonSelectOption>
                  <IonSelectOption value="income">{t('categories.income')}</IonSelectOption>
                </IonSelect>
              </IonItem>

              <IonItem className="glass-input" lines="none">
                <IonSelect value={parentId} onIonChange={e => setParentId(e.detail.value)} label={t('categories.parentCategory')} labelPlacement="floating">
                  <IonSelectOption value="">{t('categories.none')}</IonSelectOption>
                  {parentCategories.filter(c => c.type === type).map(c => (
                    <IonSelectOption key={c.id} value={c.id}>{c.name}</IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>

              <IonButton expand="block" shape="round" className="ion-margin-top" style={{ height: '50px', '--background': 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)', fontWeight: 600, fontSize: '16px', marginTop: '24px' }} onClick={handleCreate}>
                {t('common.save')}
              </IonButton>
            </IonContent>
          </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default Categories;
