import React, { useState } from 'react';
import { IonContent, IonPage, IonTitle, IonToolbar, IonList, IonItem, IonLabel, IonFab, IonFabButton, IonIcon, IonModal, IonButton, IonInput, IonSpinner, useIonViewWillEnter, IonGrid, IonRow, IonCol, IonSelect, IonSelectOption, IonButtons, IonHeader, IonSearchbar, IonSegment, IonSegmentButton } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { add, wallet, card, cash, home, car, cart, restaurant, airplane, medkit, school, gift, barbell, business, briefcase, laptop, phonePortrait, createOutline, checkmark, archiveOutline, chevronDownOutline, chevronUpOutline } from 'ionicons/icons';
import { api } from '../services/api';
import { BankLogo } from 'paybrand';
import Header from '../components/Header';
import DateFilter from '../components/DateFilter';
import { useFilter } from '../context/FilterContext';
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
  const { endDate } = useFilter();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [tab, setTab] = useState<'all' | 'banks' | 'cards'>('all');
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
  const [initialBalance, setInitialBalance] = useState('');
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
      const accUrl = endDate ? `/accounts?endDate=${endDate}` : '/accounts';
      const [accData, catData, instData] = await Promise.all([
        api.get(accUrl),
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

  React.useEffect(() => {
    loadData();
  }, [endDate]);

  const openEditModal = (acc: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingAccount(acc);
    setNewAccountName(acc.name);
    setSelectedInstitutionId(acc.institution_id);
    setSelectedIcon(acc.icon || 'wallet');
    setAccountType(acc.type);
    setInitialBalance(acc.initial_balance !== undefined && acc.initial_balance !== null ? String(acc.initial_balance) : '0');
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
        initial_balance: parseFloat(initialBalance) || 0,
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
      setInitialBalance('');
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

  const activeBankAccounts = accounts.filter(a => a.type !== 'credit_card' && !a.is_archived);
  const activeCreditCards = accounts.filter(a => a.type === 'credit_card' && !a.is_archived);
  const archivedAccounts = accounts.filter(a => a.is_archived);
  const totalBankBalance = activeBankAccounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0);
  const totalCcDebt = activeCreditCards.reduce((sum, a) => sum + (Number(a.consumed) || 0), 0);

  return (
    <IonPage>
      <Header title={t('accounts.title')} />
      <DateFilter />
      <IonContent className="ion-padding">
        <div className="app-container">
          <IonSegment value={tab} onIonChange={e => setTab(e.detail.value as any)} mode="ios" style={{ marginBottom: '16px' }}>
            <IonSegmentButton value="all">
              <IonLabel>{t('accounts.allAccounts', 'Todas las Cuentas')}</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="banks">
              <IonLabel>{t('accounts.banksAndCash', 'Cuentas')}</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="cards">
              <IonLabel>{t('accounts.creditCards', 'Tarjetas')}</IonLabel>
            </IonSegmentButton>
          </IonSegment>

          {loading ? <div className="ion-text-center ion-padding"><IonSpinner name="crescent" color="primary" /></div> : (
            <>
              {/* Summary Cards */}
              <IonGrid className="ion-margin-bottom">
                <IonRow>
                  <IonCol size="12" sizeMd="6">
                    <div className="glass-card ion-padding gradient-success" style={{ marginBottom: '12px' }}>
                      <p style={{ margin: 0, opacity: 0.85, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('dashboard.balance')}</p>
                      <h2 style={{ fontSize: '28px', fontWeight: 700, margin: '6px 0' }}>${totalBankBalance.toLocaleString()}</h2>
                      <span style={{ fontSize: '12px', opacity: 0.85 }}>{activeBankAccounts.length} cuentas activas</span>
                    </div>
                  </IonCol>
                  <IonCol size="12" sizeMd="6">
                    <div className="glass-card ion-padding gradient-danger" style={{ marginBottom: '12px' }}>
                      <p style={{ margin: 0, opacity: 0.85, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('accounts.ccDebt')}</p>
                      <h2 style={{ fontSize: '28px', fontWeight: 700, margin: '6px 0' }}>${totalCcDebt.toLocaleString()}</h2>
                      <span style={{ fontSize: '12px', opacity: 0.85 }}>{activeCreditCards.length} tarjetas de crédito</span>
                    </div>
                  </IonCol>
                </IonRow>
              </IonGrid>

              {/* Accounts List */}
              <IonList style={{ background: 'transparent' }}>
                {(tab === 'all' || tab === 'banks') && (
                  <>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ion-color-medium, #94a3b8)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '16px', marginBottom: '8px' }}>
                      {t('accounts.banksAndCash')} ({activeBankAccounts.length})
                    </h3>
                    {activeBankAccounts.map(acc => (
                      <IonItem key={acc.id} className="glass-item" lines="none" button onClick={() => history.push(`/app/transactions?accountId=${acc.id}`)}>
                        <div className="list-avatar income" slot="start">
                          {renderIcon(acc)}
                        </div>
                        <IonLabel>
                          <h2 style={{ fontWeight: 600, color: 'var(--ion-text-color)' }}>{acc.name}</h2>
                          <p style={{ color: 'var(--ion-color-medium, #94a3b8)' }}>
                            {t('accounts.balance')}: <span style={{ color: '#10b981', fontWeight: 600 }}>${(acc.balance || 0).toLocaleString()}</span>
                          </p>
                        </IonLabel>
                        <IonButton slot="end" fill="clear" color="medium" onClick={(e) => openEditModal(acc, e)}>
                          <IonIcon icon={createOutline} />
                        </IonButton>
                      </IonItem>
                    ))}
                  </>
                )}

                {(tab === 'all' || tab === 'cards') && (
                  <>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ion-color-medium, #94a3b8)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '24px', marginBottom: '8px' }}>
                      {t('accounts.creditCards')} ({activeCreditCards.length})
                    </h3>
                    {activeCreditCards.map((acc: any) => (
                      <IonItem key={acc.id} className="glass-item" lines="none" button onClick={() => history.push(`/app/credit-cards`)}>
                        <div className="list-avatar expense" slot="start">
                          {renderIcon(acc)}
                        </div>
                        <IonLabel>
                          <h2 style={{ fontWeight: 600, color: 'var(--ion-text-color)' }}>{acc.name} {acc.network ? `(${acc.network})` : ''}</h2>
                          <p style={{ color: 'var(--ion-color-medium, #94a3b8)' }}>
                            {t('accounts.consumed')}: <span style={{ color: '#f43f5e', fontWeight: 600 }}>${(acc.consumed || 0).toLocaleString()}</span> | {t('accounts.limit')}: ${(acc.credit_limit || 0).toLocaleString()}
                          </p>
                          <p style={{ fontSize: '11px', color: 'var(--ion-color-medium, #94a3b8)' }}>
                            Cierre: día {acc.closing_day || '--'} | Vence: día {acc.due_day || '--'}
                          </p>
                        </IonLabel>
                        <IonButton slot="end" fill="clear" color="primary" onClick={(e) => { e.stopPropagation(); openPayModal(acc.id); }}>
                          {t('accounts.pay')}
                        </IonButton>
                        <IonButton slot="end" fill="clear" color="medium" onClick={(e) => openEditModal(acc, e)}>
                          <IonIcon icon={createOutline} />
                        </IonButton>
                      </IonItem>
                    ))}
                  </>
                )}

                {/* Archived Accounts Section */}
                {archivedAccounts.length > 0 && (
                  <div style={{ marginTop: '24px', marginBottom: '40px' }}>
                    <IonButton fill="clear" color="medium" size="small" onClick={() => setShowArchived(!showArchived)}>
                      <IonIcon icon={archiveOutline} slot="start" />
                      {showArchived ? 'Ocultar' : 'Mostrar'} Cuentas Archivadas ({archivedAccounts.length})
                      <IonIcon icon={showArchived ? chevronUpOutline : chevronDownOutline} slot="end" />
                    </IonButton>

                    {showArchived && (
                      <IonList style={{ background: 'transparent', opacity: 0.75 }}>
                        {archivedAccounts.map(acc => (
                          <IonItem key={acc.id} className="glass-item" lines="none">
                            <div className="list-avatar" slot="start">
                              {renderIcon(acc)}
                            </div>
                            <IonLabel>
                              <h2 style={{ fontWeight: 600, textDecoration: 'line-through' }}>{acc.name}</h2>
                              <p style={{ fontSize: '12px' }}>{acc.type === 'credit_card' ? 'Tarjeta de Crédito' : 'Cuenta/Billetera'} (Archivada)</p>
                            </IonLabel>
                            <IonButton slot="end" fill="outline" size="small" color="primary" shape="round" onClick={async () => {
                              try {
                                await api.put(`/accounts/${acc.id}/restore`, {});
                                loadData();
                              } catch (err) {
                                console.error(err);
                              }
                            }}>
                              Restaurar
                            </IonButton>
                            <IonButton slot="end" fill="clear" color="medium" onClick={(e) => openEditModal(acc, e)}>
                              <IonIcon icon={createOutline} />
                            </IonButton>
                          </IonItem>
                        ))}
                      </IonList>
                    )}
                  </div>
                )}
              </IonList>
            </>
          )}

          <IonFab vertical="bottom" horizontal="end" slot="fixed" style={{ marginBottom: '16px', marginRight: '8px' }}>
            <IonFabButton onClick={() => {
              setEditingAccount(null);
              setNewAccountName('');
              setSelectedInstitutionId(null);
              setSelectedIcon('wallet');
              setAccountType('debit');
              setInitialBalance('');
              setCreditLimit('');
              setClosingDay('');
              setDueDay('');
              setNetwork('');
              setShowModal(true);
            }}>
              <IonIcon icon={add} />
            </IonFabButton>
          </IonFab>

          {/* Create / Edit Account Modal */}
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
              <IonItem className="glass-input" lines="none">
                <IonSelect value={accountType} onIonChange={e => setAccountType(e.detail.value)} disabled={!!editingAccount} label={t('accounts.type')} labelPlacement="floating">
                  <IonSelectOption value="debit">{t('accounts.bankCash')}</IonSelectOption>
                  <IonSelectOption value="credit_card">{t('accounts.creditCard')}</IonSelectOption>
                </IonSelect>
              </IonItem>
              
              <IonItem className="glass-input" lines="none">
                <IonInput value={newAccountName} onIonInput={e => setNewAccountName(e.detail.value!)} label={t('accounts.name')} labelPlacement="floating" />
              </IonItem>

              {accountType === 'debit' && (
                <IonItem className="glass-input" lines="none">
                  <IonInput type="number" value={initialBalance} onIonInput={e => setInitialBalance(e.detail.value!)} label="Saldo Inicial ($)" labelPlacement="floating" placeholder="0.00" />
                </IonItem>
              )}

              {accountType === 'credit_card' && (
                <>
                  <IonItem className="glass-input" lines="none">
                    <IonInput type="number" value={creditLimit} onIonInput={e => setCreditLimit(e.detail.value!)} label="Límite de Crédito ($)" labelPlacement="floating" />
                  </IonItem>
                  <IonItem className="glass-input" lines="none">
                    <IonInput type="number" value={closingDay} onIonInput={e => setClosingDay(e.detail.value!)} label="Día de Cierre (1-31)" labelPlacement="floating" />
                  </IonItem>
                  <IonItem className="glass-input" lines="none">
                    <IonInput type="number" value={dueDay} onIonInput={e => setDueDay(e.detail.value!)} label="Día de Vencimiento / Pago (1-31)" labelPlacement="floating" />
                  </IonItem>
                  <IonItem className="glass-input" lines="none">
                    <IonSelect value={network} onIonChange={e => setNetwork(e.detail.value)} label="Franquicia / Red (Opcional)" labelPlacement="floating">
                      <IonSelectOption value="Visa">Visa</IonSelectOption>
                      <IonSelectOption value="Mastercard">Mastercard</IonSelectOption>
                      <IonSelectOption value="American Express">American Express</IonSelectOption>
                      <IonSelectOption value="Diners Club">Diners Club</IonSelectOption>
                    </IonSelect>
                  </IonItem>
                </>
              )}
              
              <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ion-color-medium, #94a3b8)', marginTop: '20px', marginBottom: '8px' }}>Ícono o Banco</h4>
              
              <IonSearchbar 
                value={searchBank} 
                onIonInput={e => setSearchBank(e.detail.value!)} 
                placeholder="Buscar banco..." 
                style={{ '--border-radius': '16px', '--background': 'var(--ion-color-step-100, rgba(255,255,255,0.06))', padding: '0 0 12px 0' }}
              />
              <div className="glass-card" style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '16px', padding: '4px' }}>
                <IonList style={{ background: 'transparent' }}>
                  {institutions
                    .filter(inst => inst.name.toLowerCase().includes(searchBank.toLowerCase()) || inst.code.toLowerCase().includes(searchBank.toLowerCase()))
                    .map(inst => (
                      <IonItem button key={inst.id} onClick={() => { setSelectedInstitutionId(inst.id); setSelectedIcon(''); }} detail={false} lines="full" style={{ '--background': 'transparent' }}>
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
              </div>

              <IonLabel color="medium" style={{ fontSize: '13px', fontWeight: 600 }}>Íconos Generales</IonLabel>
              <IonGrid className="ion-margin-top ion-no-padding">
                <IonRow>
                  {ICONS_LIST.map(iconName => (
                    <IonCol size="3" key={iconName} className="ion-text-center">
                      <IonButton 
                        fill={!selectedInstitutionId && selectedIcon === iconName ? "solid" : "clear"} 
                        shape="round"
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

              <IonButton expand="block" shape="round" className="ion-margin-top" style={{ height: '50px', '--background': 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)', fontWeight: 600, fontSize: '16px', marginTop: '24px' }} onClick={handleCreate}>
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
          <IonModal isOpen={showPayModal} onDidDismiss={() => setShowPayModal(false)} className="glass-modal">
            <IonHeader>
              <IonToolbar>
                <IonTitle>{t('accounts.payCard')}</IonTitle>
                <IonButton slot="end" fill="clear" onClick={() => setShowPayModal(false)}>{t('common.cancel')}</IonButton>
              </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
              <IonItem className="glass-input" lines="none">
                <IonSelect value={payFundingAccountId} onIonChange={e => setPayFundingAccountId(e.detail.value)} label={t('accounts.fundingAccount')} labelPlacement="floating">
                  {activeBankAccounts.map((acc: any) => (
                    <IonSelectOption key={acc.id} value={acc.id}>{acc.name}</IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>

              <IonItem className="glass-input" lines="none">
                <IonSelect value={payCategoryId} onIonChange={e => setPayCategoryId(e.detail.value)} label="Categoría de Gasto" labelPlacement="floating">
                  {categories.filter(c => c.type === 'expense').map(c => (
                    <IonSelectOption key={c.id} value={c.id}>
                      {c.parent_id ? `- ${c.name}` : c.name}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>

              <IonItem className="glass-input" lines="none">
                <IonInput type="number" value={payAmount} onIonInput={e => setPayAmount(e.detail.value!)} label={t('accounts.payAmount')} labelPlacement="floating" />
              </IonItem>

              <IonButton expand="block" shape="round" className="ion-margin-top" style={{ height: '50px', '--background': 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)', fontWeight: 600, fontSize: '16px', marginTop: '24px' }} onClick={handlePayCard}>
                {t('accounts.processPayment')}
              </IonButton>
            </IonContent>
          </IonModal>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Accounts;
