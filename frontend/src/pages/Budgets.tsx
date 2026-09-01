import React, { useEffect, useState } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonItem, IonLabel, IonFab, IonFabButton, IonIcon, IonModal, IonButton, IonInput, IonSpinner, useIonViewWillEnter, IonSelect, IonSelectOption } from '@ionic/react';
import { add } from 'ionicons/icons';
import { api } from '../services/api';
import Header from '../components/Header';
import DateFilter from '../components/DateFilter';
import { useFilter } from '../context/FilterContext';
import { useTranslation } from 'react-i18next';

const Budgets: React.FC = () => {
  const { startDate } = useFilter();
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const { t } = useTranslation();

  const loadBudgets = async () => {
    try {
      const data = await api.get(`/budgets?startDate=${startDate}`);
      setBudgets(data);
      const catData = await api.get('/categories');
      setCategories(catData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useIonViewWillEnter(() => {
    loadBudgets();
  });

  useEffect(() => {
    loadBudgets();
  }, [startDate]);

  const handleCreate = async () => {
    if (!categoryId || !amount) return;
    try {
      await api.post('/budgets', { category_id: categoryId, amount: parseFloat(amount) });
      setCategoryId('');
      setAmount('');
      setShowModal(false);
      loadBudgets();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <IonPage>
      <Header title={t('budgets.title')} />
      <DateFilter />
      <IonContent className="ion-padding">
        <div className="app-container">
          {loading ? <div className="ion-text-center ion-padding"><IonSpinner name="crescent" color="primary" /></div> : (
            <IonList style={{ background: 'transparent' }}>
              {budgets.map(b => {
                const cat = categories.find(c => c.id === b.category_id);
                return (
                  <IonItem key={b.id} className="glass-item" lines="none">
                    <IonLabel>
                      <h2 style={{ fontWeight: 600, color: 'var(--ion-text-color)' }}>{cat ? cat.name : 'Unknown'}</h2>
                      <p style={{ color: 'var(--ion-color-medium, #94a3b8)' }}>{t('budgets.amount', 'Límite')}: <span style={{ color: 'var(--ion-text-color)', fontWeight: 600 }}>${b.limit_amount?.toLocaleString()}</span></p>
                    </IonLabel>
                  </IonItem>
                );
              })}
              {budgets.length === 0 && <div className="ion-padding ion-text-center" style={{ color: 'var(--ion-color-medium, #94a3b8)' }}>{t('common.noTransactions')}</div>}
            </IonList>
          )}

          <IonFab vertical="bottom" horizontal="end" slot="fixed" style={{ marginBottom: '16px', marginRight: '8px' }}>
            <IonFabButton onClick={() => setShowModal(true)}>
              <IonIcon icon={add} />
            </IonFabButton>
          </IonFab>

          {/* Create Budget Modal */}
          <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)} className="glass-modal">
            <IonHeader>
              <IonToolbar>
                <IonTitle>{t('budgets.addBudget')}</IonTitle>
                <IonButton slot="end" fill="clear" onClick={() => setShowModal(false)}>{t('common.cancel')}</IonButton>
              </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
              <IonItem className="glass-input" lines="none">
                <IonSelect value={categoryId} onIonChange={e => setCategoryId(e.detail.value)} label={t('budgets.selectCategory')} labelPlacement="floating">
                  {categories.filter(c => c.type === 'expense').map(c => (
                    <IonSelectOption key={c.id} value={c.id}>
                      {c.parent_id ? `- ${c.name}` : c.name}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>
              <IonItem className="glass-input" lines="none">
                <IonInput type="number" value={amount} onIonInput={e => setAmount(e.detail.value!)} label={t('budgets.amount')} labelPlacement="floating" />
              </IonItem>
              <IonButton expand="block" shape="round" className="ion-margin-top" style={{ height: '50px', '--background': 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)', fontWeight: 600, fontSize: '16px', marginTop: '24px' }} onClick={handleCreate}>
                {t('common.save')}
              </IonButton>
            </IonContent>
          </IonModal>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Budgets;
