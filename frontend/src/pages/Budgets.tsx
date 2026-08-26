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
        {loading ? <IonSpinner className="ion-margin" /> : (
          <IonList style={{ background: 'transparent' }}>
            {budgets.map(b => {
              const cat = categories.find(c => c.id === b.category_id);
              return (
                <IonItem key={b.id} className="glass-item" lines="none">
                  <IonLabel>
                    <h2 style={{ fontWeight: 600, color: '#fff' }}>{cat ? cat.name : 'Unknown'}</h2>
                    <p style={{ color: '#94a3b8' }}>Limit: <span style={{ color: '#fff', fontWeight: 500 }}>${b.limit_amount}</span></p>
                  </IonLabel>
                </IonItem>
              );
            })}
            {budgets.length === 0 && <div className="ion-padding ion-text-center" style={{ color: '#94a3b8' }}>{t('common.noTransactions')}</div>}
          </IonList>
        )}

        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => setShowModal(true)}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>
        {/* Create Budget Modal */}
        <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)} className="glass-modal">
          <IonHeader>
            <IonToolbar>
              <IonTitle>{t('budgets.addBudget')}</IonTitle>
              <IonButton slot="end" fill="clear" onClick={() => setShowModal(false)} color="light">{t('common.cancel')}</IonButton>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <IonItem>
              <IonLabel position="floating">{t('budgets.selectCategory')}</IonLabel>
              <IonSelect value={categoryId} onIonChange={e => setCategoryId(e.detail.value)}>
                {categories.filter(c => c.type === 'expense').map(c => (
                  <IonSelectOption key={c.id} value={c.id}>
                    {c.parent_id ? `- ${c.name}` : c.name}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>
            <IonItem>
              <IonLabel position="floating">{t('budgets.amount')}</IonLabel>
              <IonInput type="number" value={amount} onIonInput={e => setAmount(e.detail.value!)} />
            </IonItem>
            <IonButton expand="block" className="ion-margin-top" onClick={handleCreate}>{t('common.save')}</IonButton>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default Budgets;
