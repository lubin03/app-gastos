import React, { useState } from 'react';
import { IonContent, IonPage, IonTitle, IonToolbar, IonList, IonItem, IonLabel, IonFab, IonFabButton, IonIcon, IonModal, IonButton, IonInput, IonSpinner, useIonViewWillEnter, IonGrid, IonRow, IonCol, IonSelect, IonSelectOption, IonListHeader, IonButtons, IonHeader } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { add, wallet, card, cash, home, car, cart, restaurant, airplane, medkit, school, gift, barbell, business, briefcase, laptop, phonePortrait, createOutline } from 'ionicons/icons';
import { api } from '../services/api';
import { BankLogo } from 'paybrand';
import Header from '../components/Header';
import { useTranslation } from 'react-i18next';

const ICONS_MAP: Record<string, string> = {
  wallet, card, cash, home, car, cart, restaurant, airplane, medkit, school, gift, barbell, business, briefcase, laptop, phonePortrait
};
const ICONS_LIST = Object.keys(ICONS_MAP);
const BANK_ICONS = ['bancolombia', 'nequi', 'davivienda', 'nubank', 'paypal', 'apple-pay', 'google-pay', 'stripe', 'wise', 'revolut'];
const LOCAL_BANKS = ['bancolombia', 'nequi', 'davivienda'];

const renderIcon = (iconName: string) => {
  if (iconName?.startsWith('bank:')) {
    const name = iconName.replace('bank:', '');
    if (LOCAL_BANKS.includes(name)) {
      return (
        <div slot="start" style={{ marginRight: '16px', display: 'flex', alignItems: 'center', width: '24px', height: '24px', justifyContent: 'center' }}>
          <img src={`/assets/banks/${name}.svg`} alt={name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
      );
    }
    return (
      <div slot="start" style={{ marginRight: '16px', display: 'flex', alignItems: 'center', width: '24px', justifyContent: 'center' }}>
        <BankLogo name={name as any} size={24} />
      </div>
    );
  }
  return <IonIcon icon={ICONS_MAP[iconName] || wallet} slot="start" />;
};

const Accounts: React.FC = () => {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const history = useHistory();
  const { t } = useTranslation();

  // Create/Edit Modal
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [newAccountName, setNewAccountName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('bank:bancolombia');
  const [accountType, setAccountType] = useState('debit');
  const [creditLimit, setCreditLimit] = useState('');
  const [closingDay, setClosingDay] = useState('');
  const [dueDay, setDueDay] = useState('');

  // Pay Modal
  const [showPayModal, setShowPayModal] = useState(false);
  const [payCardId, setPayCardId] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payFundingAccountId, setPayFundingAccountId] = useState('');
  const [payCategoryId, setPayCategoryId] = useState('');

  const loadData = async () => {
    try {
      const [accData, catData] = await Promise.all([
        api.get('/accounts'),
        api.get('/categories')
      ]);
      setAccounts(accData);
      setCategories(catData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useIonViewWillEnter(() => {
    loadData();
  });

  const openEditModal = (acc: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingAccount(acc);
    setNewAccountName(acc.name);
    setSelectedIcon(acc.icon || 'bank:nubank');
    setAccountType(acc.type);
    setCreditLimit(acc.credit_limit || '');
    setClosingDay(acc.closing_day || '');
    setDueDay(acc.due_day || '');
    setShowModal(true);
  };

  const handleCreate = async () => {
    if (!newAccountName) return;
    try {
      const payload = { 
        name: newAccountName, 
        icon: selectedIcon,
        type: accountType,
        credit_limit: accountType === 'credit_card' ? parseFloat(creditLimit) : null,
        closing_day: accountType === 'credit_card' ? parseInt(closingDay) : null,
        due_day: accountType === 'credit_card' ? parseInt(dueDay) : null
      };

      if (editingAccount) {
        await api.put(`/accounts/${editingAccount.id}`, payload);
      } else {
        await api.post('/accounts', payload);
      }

      setNewAccountName('');
      setSelectedIcon('bank:nubank');
      setAccountType('debit');
      setCreditLimit('');
      setClosingDay('');
      setDueDay('');
      setEditingAccount(null);
      setShowModal(false);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const openPayModal = (cardId: string) => {
    setPayCardId(cardId);
    setShowPayModal(true);
  };

  const handlePayCard = async () => {
    if (!payCardId || !payAmount || !payFundingAccountId || !payCategoryId) return;
    try {
      await api.post(`/accounts/${payCardId}/pay`, {
        funding_account_id: payFundingAccountId,
        amount: parseFloat(payAmount),
        category_id: payCategoryId,
        description: 'Pago de tarjeta de crédito'
      });
      setPayAmount('');
      setPayFundingAccountId('');
      setPayCategoryId('');
      setShowPayModal(false);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const bankAccounts = accounts.filter(a => a.type !== 'credit_card');
  const creditCards = accounts.filter(a => a.type === 'credit_card');

  return (
    <IonPage>
      <Header title={t('accounts.title')} />
      <IonContent className="ion-padding-horizontal">
        {loading ? <IonSpinner className="ion-margin ion-text-center" color="primary" /> : (
          <IonList style={{ background: 'transparent', paddingBottom: '80px' }}>
            {bankAccounts.length > 0 && (
              <>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '20px', marginBottom: '12px', paddingLeft: '8px' }}>
                  {t('accounts.bankCash')}
                </h3>
                {bankAccounts.map(acc => (
                  <IonItem key={acc.id} button className="glass-item" lines="none" onClick={() => history.push(`/app/transactions?accountId=${acc.id}`)}>
                    {renderIcon(acc.icon)}
                    <IonLabel>
                      <h2 style={{ fontWeight: 600, fontSize: '16px', color: '#fff' }}>{acc.name}</h2>
                    </IonLabel>
                    <IonButton slot="end" fill="clear" onClick={(e) => openEditModal(acc, e)} color="light">
                      <IonIcon icon={createOutline} />
                    </IonButton>
                  </IonItem>
                ))}
              </>
            )}

            {creditCards.length > 0 && (
              <>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '24px', marginBottom: '12px', paddingLeft: '8px' }}>
                  {t('accounts.creditCard')}
                </h3>
                {creditCards.map(acc => (
                  <IonItem key={acc.id} button className="glass-item" lines="none" onClick={() => history.push(`/app/transactions?accountId=${acc.id}`)}>
                    {renderIcon(acc.icon)}
                    <IonLabel>
                      <h2 style={{ fontWeight: 600, fontSize: '16px', color: '#fff' }}>{acc.name}</h2>
                      <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                        Limit: <span style={{ color: '#fff' }}>${acc.credit_limit}</span> | Closing: <span style={{ color: '#fff' }}>{acc.closing_day}</span> | Due: <span style={{ color: '#fff' }}>{acc.due_day}</span>
                      </p>
                    </IonLabel>
                    <IonButtons slot="end" style={{ flexDirection: 'column', height: '100%', padding: '8px 0' }}>
                      <IonButton onClick={(e) => openEditModal(acc, e)} color="light" size="small" style={{ margin: 0, height: '24px' }}>
                        <IonIcon icon={createOutline} />
                      </IonButton>
                      <IonButton onClick={(e) => { e.stopPropagation(); openPayModal(acc.id); }} color="primary" size="small" style={{ margin: '4px 0 0 0', fontWeight: 'bold' }}>
                        PAY
                      </IonButton>
                    </IonButtons>
                  </IonItem>
                ))}
              </>
            )}
            {accounts.length === 0 && <IonItem><IonLabel>{t('common.noTransactions')}</IonLabel></IonItem>}
          </IonList>
        )}

        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => {
            setEditingAccount(null);
            setNewAccountName('');
            setSelectedIcon('bank:nubank');
            setAccountType('debit');
            setCreditLimit('');
            setClosingDay('');
            setDueDay('');
            setShowModal(true);
          }}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>

        {/* Create/Edit Account Modal */}
        <IonModal isOpen={showModal} onDidDismiss={() => {
          setShowModal(false);
          setEditingAccount(null);
        }} className="glass-modal">
          <IonHeader>
            <IonToolbar>
              <IonTitle>{editingAccount ? t('accounts.editAccount') : t('accounts.addAccount')}</IonTitle>
              <IonButton slot="end" fill="clear" onClick={() => {
                setShowModal(false);
                setEditingAccount(null);
              }}>{t('common.cancel')}</IonButton>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <IonItem>
              <IonLabel position="floating">{t('accounts.type')}</IonLabel>
              <IonSelect value={accountType} onIonChange={e => setAccountType(e.detail.value)} disabled={!!editingAccount}>
                <IonSelectOption value="debit">{t('accounts.bankCash')}</IonSelectOption>
                <IonSelectOption value="credit_card">{t('accounts.creditCard')}</IonSelectOption>
              </IonSelect>
            </IonItem>
            
            <IonItem>
              <IonLabel position="floating">{t('accounts.name')}</IonLabel>
              <IonInput value={newAccountName} onIonInput={e => setNewAccountName(e.detail.value!)} />
            </IonItem>

            {accountType === 'credit_card' && (
              <>
                <IonItem>
                  <IonLabel position="floating">Credit Limit ($)</IonLabel>
                  <IonInput type="number" value={creditLimit} onIonInput={e => setCreditLimit(e.detail.value!)} />
                </IonItem>
                <IonItem>
                  <IonLabel position="floating">Closing Day (1-31)</IonLabel>
                  <IonInput type="number" value={closingDay} onIonInput={e => setClosingDay(e.detail.value!)} />
                </IonItem>
                <IonItem>
                  <IonLabel position="floating">Due Day (1-31)</IonLabel>
                  <IonInput type="number" value={dueDay} onIonInput={e => setDueDay(e.detail.value!)} />
                </IonItem>
              </>
            )}
            
            <h4 className="ion-margin-top ion-padding-horizontal">Select Icon</h4>
            
            <IonLabel className="ion-padding-horizontal" color="medium">Banks & Wallets</IonLabel>
            <IonGrid>
              <IonRow>
                {BANK_ICONS.map(bank => (
                  <IonCol size="3" key={`bank:${bank}`} className="ion-text-center">
                    <IonButton 
                      fill={selectedIcon === `bank:${bank}` ? "solid" : "clear"} 
                      onClick={() => setSelectedIcon(`bank:${bank}`)}
                    >
                      {LOCAL_BANKS.includes(bank) ? (
                        <img src={`/assets/banks/${bank}.svg`} alt={bank} style={{ width: 24, height: 24, objectFit: 'contain' }} />
                      ) : (
                        <BankLogo name={bank as any} size={24} />
                      )}
                    </IonButton>
                  </IonCol>
                ))}
              </IonRow>
            </IonGrid>

            <IonLabel className="ion-padding-horizontal" color="medium">General Icons</IonLabel>
            <IonGrid>
              <IonRow>
                {ICONS_LIST.map(iconName => (
                  <IonCol size="3" key={iconName} className="ion-text-center">
                    <IonButton 
                      fill={selectedIcon === iconName ? "solid" : "clear"} 
                      onClick={() => setSelectedIcon(iconName)}
                    >
                      <IonIcon icon={ICONS_MAP[iconName]} />
                    </IonButton>
                  </IonCol>
                ))}
              </IonRow>
            </IonGrid>

            <IonButton expand="block" className="ion-margin-top" onClick={handleCreate}>
              {editingAccount ? t('common.save') : t('common.add')}
            </IonButton>
          </IonContent>
        </IonModal>

        {/* Pay Card Modal */}
        <IonModal isOpen={showPayModal} onDidDismiss={() => setShowPayModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>{t('accounts.payCard')}</IonTitle>
              <IonButton slot="end" fill="clear" onClick={() => setShowPayModal(false)}>{t('common.cancel')}</IonButton>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <IonItem>
              <IonLabel position="floating">{t('accounts.fundingAccount')}</IonLabel>
              <IonSelect value={payFundingAccountId} onIonChange={e => setPayFundingAccountId(e.detail.value)}>
                {bankAccounts.map(acc => (
                  <IonSelectOption key={acc.id} value={acc.id}>{acc.name}</IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>

            <IonItem>
              <IonLabel position="floating">Expense Category (e.g. CC Payment)</IonLabel>
              <IonSelect value={payCategoryId} onIonChange={e => setPayCategoryId(e.detail.value)}>
                {categories.filter(c => c.type === 'expense').map(c => (
                  <IonSelectOption key={c.id} value={c.id}>
                    {c.parent_id ? `- ${c.name}` : c.name}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>

            <IonItem>
              <IonLabel position="floating">{t('accounts.payAmount')}</IonLabel>
              <IonInput type="number" value={payAmount} onIonInput={e => setPayAmount(e.detail.value!)} />
            </IonItem>

            <IonButton expand="block" className="ion-margin-top" onClick={handlePayCard}>{t('accounts.processPayment')}</IonButton>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default Accounts;
