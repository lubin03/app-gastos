import React, { useState, useEffect } from 'react';
import { IonModal, IonHeader, IonToolbar, IonTitle, IonButton, IonContent, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption } from '@ionic/react';
import { api } from '../services/api';
import { useTranslation } from 'react-i18next';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  transaction?: any;
}

const TransactionModal: React.FC<Props> = ({ isOpen, onClose, onSaved, transaction }) => {
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [accountId, setAccountId] = useState('');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const { t } = useTranslation();

  useEffect(() => {
    if (isOpen) {
      api.get('/accounts').then(setAccounts).catch(console.error);
      api.get('/categories').then(setCategories).catch(console.error);

      if (transaction) {
        setType(transaction.type);
        setAmount(transaction.amount);
        setCategoryId(transaction.category_id);
        setDescription(transaction.description);
        setAccountId(transaction.account_id);
      } else {
        setType('expense');
        setAmount('');
        setCategoryId('');
        setDescription('');
        setAccountId('');
      }
    }
  }, [isOpen, transaction]);

  const handleSave = async () => {
    try {
      const payload = {
        type,
        amount: parseFloat(amount),
        category_id: categoryId,
        description,
        accountId,
        date: transaction ? transaction.date : new Date().toISOString()
      };

      if (transaction) {
        await api.put(`/transactions/${transaction.id}`, payload);
      } else {
        await api.post('/transactions', payload);
      }
      onSaved();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose} className="glass-modal">
      <IonHeader>
        <IonToolbar>
          <IonTitle>{transaction ? t('transactions.editTransaction') : t('transactions.addTransaction')}</IonTitle>
          <IonButton slot="end" fill="clear" onClick={onClose}>{t('common.cancel')}</IonButton>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonItem className="glass-input" lines="none">
          <IonLabel>{t('transactions.type')}</IonLabel>
          <IonSelect value={type} onIonChange={e => setType(e.detail.value)}>
            <IonSelectOption value="expense">{t('transactions.expense')}</IonSelectOption>
            <IonSelectOption value="income">{t('transactions.income')}</IonSelectOption>
            <IonSelectOption value="transfer">{t('transactions.transfer')}</IonSelectOption>
          </IonSelect>
        </IonItem>
        <IonItem className="glass-input" lines="none">
          <IonSelect value={accountId} onIonChange={e => setAccountId(e.detail.value)} label={t('transactions.account')} labelPlacement="floating">
            {accounts.map(acc => (
              <IonSelectOption key={acc.id} value={acc.id}>{acc.name}</IonSelectOption>
            ))}
          </IonSelect>
        </IonItem>
        <IonItem className="glass-input" lines="none">
          <IonInput type="number" value={amount} onIonInput={e => setAmount(e.detail.value!)} label={t('common.amount')} labelPlacement="floating" />
        </IonItem>
        <IonItem className="glass-input" lines="none">
          <IonSelect value={categoryId} onIonChange={e => setCategoryId(e.detail.value)} label={t('common.category')} labelPlacement="floating">
            {categories.filter(c => c.type === type).map(c => (
              <IonSelectOption key={c.id} value={c.id}>
                {c.parent_id ? `- ${c.name}` : c.name}
              </IonSelectOption>
            ))}
          </IonSelect>
        </IonItem>
        <IonItem className="glass-input" lines="none">
          <IonInput value={description} onIonInput={e => setDescription(e.detail.value!)} label={t('common.description')} labelPlacement="floating" />
        </IonItem>
        <IonButton expand="block" shape="round" className="ion-margin-top" style={{ height: '50px', '--background': 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)', fontWeight: 600, fontSize: '16px' }} onClick={handleSave}>
          {t('common.save')}
        </IonButton>
      </IonContent>
    </IonModal>
  );
};

export default TransactionModal;
