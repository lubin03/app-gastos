import React, { useState } from 'react';
import { IonContent, IonPage, IonTitle, IonToolbar, IonList, IonItem, IonLabel, IonFab, IonFabButton, IonIcon, IonModal, IonButton, IonInput, IonSpinner, useIonViewWillEnter, IonGrid, IonRow, IonCol, IonSelect, IonSelectOption, IonButtons, IonHeader, IonSearchbar } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { add, wallet, card, cash, home, car, cart, restaurant, airplane, medkit, school, gift, barbell, business, briefcase, laptop, phonePortrait, createOutline, checkmark } from 'ionicons/icons';
import { api } from '../services/api';
import { BankLogo } from 'paybrand';
import Header from '../components/Header';
import { useTranslation } from 'react-i18next';
import { institutionService, Institution } from '../services/institutionService';

const ICONS_MAP: Record<string, string> = {
  wallet, card, cash, home, car, cart, restaurant, airplane, medkit, school, gift, barbell, business, briefcase, laptop, phonePortrait
};
const ICONS_LIST = Object.keys(ICONS_MAP);

const renderIcon = (acc: any) => {
  if (acc.institution) {
    if (acc.institution.logo_url && acc.institution.logo_url.startsWith('/assets')) {
      return (
        <div slot="start" style={{ marginRight: '16px', display: 'flex', alignItems: 'center', width: '24px', height: '24px', justifyContent: 'center' }}>
          <img src={acc.institution.logo_url} alt={acc.institution.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
      );
    }
    return (
      <div slot="start" style={{ marginRight: '16px', display: 'flex', alignItems: 'center', width: '24px', justifyContent: 'center' }}>
        <BankLogo name={acc.institution.code as any} size={24} />
      </div>
    );
  }
  return <IonIcon icon={ICONS_MAP[acc.icon] || wallet} slot="start" />;
};

const Accounts: React.FC = () => {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const history = useHistory();
  const { t } = useTranslation();

  // Create/Edit Modal
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [newAccountName, setNewAccountName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('wallet');
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string | null>(null);
  const [searchBank, setSearchBank] = useState('');
  const [accountType, setAccountType] = useState('debit');
  const [creditLimit, setCreditLimit] = useState('');
  const [closingDay, setClosingDay] = useState('');
  const [dueDay, setDueDay] = useState('');
  const [network, setNetwork] = useState('');

  // Pay Modal
  const [showPayModal, setShowPayModal] = useState(false);
  const [payCardId, setPayCardId] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payFundingAccountId, setPayFundingAccountId] = useState('');
  const [payCategoryId, setPayCategoryId] = useState('');

  const loadData = async () => {
    try {
      const [accData, catData, instData] = await Promise.all([
        api.get('/accounts'),
        api.get('/categories'),
        institutionService.getInstitutions()
      ]);
      setAccounts(accData);
      setCategories(catData);
      setInstitutions(instData);
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
    setSelectedInstitutionId(acc.institution_id);
    setSelectedIcon(acc.icon || 'wallet');
    setAccountType(acc.type);
    setCreditLimit(acc.credit_limit || '');
    setClosingDay(acc.closing_day || '');
    setDueDay(acc.due_day || '');
    setNetwork(acc.network || '');
    setShowModal(true);
  };

  const handleCreate = async () => {
    if (!newAccountName) return;
    try {
      const payload = { 
        name: newAccountName, 
        icon: selectedInstitutionId ? null : selectedIcon,
        institution_id: selectedInstitutionId,
        type: accountType,
        credit_limit: accountType === 'credit_card' ? parseFloat(creditLimit) : null,
        closing_day: accountType === 'credit_card' ? parseInt(closingDay) : null,
        due_day: accountType === 'credit_card' ? parseInt(dueDay) : null,
        network: accountType === 'credit_card' ? network : null
      };

      if (editingAccount) {
        await api.put(`/accounts/${editingAccount.id}`, payload);
      } else {
        await api.post('/accounts', payload);
      }

      setNewAccountName('');
      setSelectedIcon('wallet');
      setSelectedInstitutionId(null);
      setAccountType('debit');
      setCreditLimit('');
      setClosingDay('');
      setDueDay('');
      setNetwork('');
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
                    {renderIcon(acc)}
                    <IonLabel>
                      <h2 style={{ fontWeight: 600, fontSize: '16px', color: '#fff' }}>
                        {acc.name} {acc.is_archived && <span style={{fontSize: '10px', background: '#333', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px'}}>ARCHIVADA</span>}
                      </h2>
                    </IonLabel>
                    <IonButton slot="end" fill="clear" onClick={(e) => openEditModal(acc, e)} color="primary">
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
                    {renderIcon(acc)}
                    <IonLabel>
                      <h2 style={{ fontWeight: 600, fontSize: '16px', color: '#fff' }}>
                        {acc.name} {acc.is_archived && <span style={{fontSize: '10px', background: '#333', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px'}}>ARCHIVADA</span>}
                      </h2>
                      <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                        Limit: <span style={{ color: '#fff' }}>${acc.credit_limit}</span> | Closing: <span style={{ color: '#fff' }}>{acc.closing_day}</span> | Due: <span style={{ color: '#fff' }}>{acc.due_day}</span>
                        {acc.network && <span> | Network: <span style={{ color: '#fff' }}>{acc.network}</span></span>}
                      </p>
                    </IonLabel>
                    <IonButtons slot="end" style={{ flexDirection: 'column', height: '100%', padding: '8px 0' }}>
                      <IonButton onClick={(e) => openEditModal(acc, e)} color="primary" fill="clear" size="small" style={{ margin: 0, height: '24px' }}>
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
            setSelectedIcon('wallet');
            setSelectedInstitutionId(null);
            setSearchBank('');
            setAccountType('debit');
            setCreditLimit('');
            setClosingDay('');
            setDueDay('');
            setNetwork('');
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
                <IonItem>
                  <IonLabel position="floating">Franquicia / Red (Opcional)</IonLabel>
                  <IonSelect value={network} onIonChange={e => setNetwork(e.detail.value)}>
                    <IonSelectOption value="Visa">Visa</IonSelectOption>
                    <IonSelectOption value="Mastercard">Mastercard</IonSelectOption>
                    <IonSelectOption value="American Express">American Express</IonSelectOption>
                    <IonSelectOption value="Diners Club">Diners Club</IonSelectOption>
                  </IonSelect>
                </IonItem>
              </>
            )}
            
            <h4 className="ion-margin-top ion-padding-horizontal">Ícono o Banco</h4>
            
            <IonLabel className="ion-padding-horizontal" color="medium">Bancos e Instituciones</IonLabel>
            <IonSearchbar 
              value={searchBank} 
              onIonInput={e => setSearchBank(e.detail.value!)} 
              placeholder="Buscar banco..." 
              className="ion-padding-horizontal"
              style={{ paddingBottom: 0 }}
            />
            <IonList style={{ maxHeight: '250px', overflowY: 'auto', margin: '0 16px', borderRadius: '8px', border: '1px solid #333' }}>
              {institutions
                .filter(inst => inst.name.toLowerCase().includes(searchBank.toLowerCase()) || inst.code.toLowerCase().includes(searchBank.toLowerCase()))
                .map(inst => (
                  <IonItem button key={inst.id} onClick={() => { setSelectedInstitutionId(inst.id); setSelectedIcon(''); }} detail={false} lines="full">
                    {inst.logo_url && inst.logo_url.startsWith('/assets') ? (
                      <img src={inst.logo_url} alt={inst.code} style={{ width: 24, height: 24, objectFit: 'contain', marginRight: '12px' }} slot="start" />
                    ) : (
                      <div slot="start" style={{ marginRight: '12px' }}><BankLogo name={inst.code as any} size={24} /></div>
                    )}
                    <IonLabel style={{ fontSize: '14px' }}>{inst.name}</IonLabel>
                    {selectedInstitutionId === inst.id && <IonIcon icon={checkmark} slot="end" color="primary" />}
                  </IonItem>
              ))}
            </IonList>

            <IonLabel className="ion-padding-horizontal" color="medium">Íconos Generales</IonLabel>
            <IonGrid>
              <IonRow>
                {ICONS_LIST.map(iconName => (
                  <IonCol size="3" key={iconName} className="ion-text-center">
                    <IonButton 
                      fill={!selectedInstitutionId && selectedIcon === iconName ? "solid" : "clear"} 
                      onClick={() => {
                        setSelectedInstitutionId(null);
                        setSelectedIcon(iconName);
                      }}
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
            
            {editingAccount && !editingAccount.is_archived && (
              <IonButton expand="block" color="warning" fill="clear" className="ion-margin-top" onClick={async () => {
                if (window.confirm('¿Estás seguro de archivar esta cuenta? (Borrado Lógico)')) {
                  try {
                    await api.delete(`/accounts/${editingAccount.id}`);
                    setEditingAccount(null);
                    setShowModal(false);
                    loadData();
                  } catch (err) {
                    console.error(err);
                  }
                }
              }}>
                Archivar Cuenta (Ocultar)
              </IonButton>
            )}

            {editingAccount && editingAccount.is_archived && (
              <IonButton expand="block" color="danger" fill="clear" className="ion-margin-top" onClick={async () => {
                if (window.confirm('¿Estás seguro de ELIMINAR PERMANENTEMENTE esta cuenta? Esta acción no se puede deshacer y borrará todas las transacciones asociadas.')) {
                  try {
                    await api.delete(`/accounts/${editingAccount.id}?force=true`);
                    setEditingAccount(null);
                    setShowModal(false);
                    loadData();
                  } catch (err) {
                    console.error(err);
                  }
                }
              }}>
                Eliminar Definitivamente
              </IonButton>
            )}
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
