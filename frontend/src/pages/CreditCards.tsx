import React, { useState } from 'react';
import { 
  IonContent, IonPage, IonList, IonItem, IonLabel, IonSpinner, IonIcon, 
  useIonViewWillEnter, IonProgressBar, IonModal, IonButton, IonHeader, 
  IonToolbar, IonTitle, IonButtons, IonSelect, IonSelectOption, IonInput,
  IonBadge, IonChip, useIonToast
} from '@ionic/react';
import { 
  cardOutline, closeOutline, checkmarkCircleOutline, ellipseOutline, 
  arrowForwardOutline, calendarOutline, cashOutline, timeOutline, checkmarkOutline
} from 'ionicons/icons';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';
import { api } from '../services/api';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const CreditCards: React.FC = () => {
  const { t } = useTranslation();
  const [presentToast] = useIonToast();

  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<any[]>([]);
  const [selectedCard, setSelectedCard] = useState<any>(null);
  
  // Invoices & Transactions state
  const [invoices, setInvoices] = useState<any[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [txLoading, setTxLoading] = useState(false);
  
  // Payment Modal state
  const [showPayModal, setShowPayModal] = useState(false);
  const [fundingAccounts, setFundingAccounts] = useState<any[]>([]);
  const [selectedFundingAccount, setSelectedFundingAccount] = useState<string>('');
  const [payAmount, setPayAmount] = useState<string>('');

  useIonViewWillEnter(() => {
    fetchCards();
    fetchAccounts();
  });

  const fetchCards = async () => {
    try {
      setLoading(true);
      const data = await api.get('/credit-cards');
      setCards(data);
    } catch (err) {
      console.error('Failed to load credit cards', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const data = await api.get('/accounts');
      setFundingAccounts(data.filter((a: any) => a.type !== 'credit_card'));
    } catch (err) {
      console.error('Failed to load accounts', err);
    }
  };

  const openCardDetails = async (card: any) => {
    setSelectedCard(card);
    setPayAmount(card.consumed.toString());
    try {
      setTxLoading(true);
      // 1. Fetch Invoices for this card
      const invData = await api.get(`/credit-cards/${card.id}/invoices`);
      setInvoices(invData);

      // Select current or first invoice
      const activeInv = invData.find((inv: any) => inv.is_current) || invData[0];
      if (activeInv) {
        setSelectedInvoiceId(activeInv.id);
        const txData = await api.get(`/credit-cards/${card.id}/transactions?invoice_id=${activeInv.id}`);
        setTransactions(txData);
      } else {
        const txData = await api.get(`/credit-cards/${card.id}/transactions`);
        setTransactions(txData);
      }
    } catch (err) {
      console.error('Failed to load card details', err);
    } finally {
      setTxLoading(false);
    }
  };

  const handleInvoiceChange = async (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId);
    if (!selectedCard) return;
    try {
      setTxLoading(true);
      let url = `/credit-cards/${selectedCard.id}/transactions`;
      if (invoiceId === 'ALL') {
        url += '?all=true';
      } else if (invoiceId) {
        url += `?invoice_id=${invoiceId}`;
      }
      const data = await api.get(url);
      setTransactions(data);
    } catch (err) {
      console.error('Failed to load invoice transactions', err);
    } finally {
      setTxLoading(false);
    }
  };

  const handleMoveTransaction = async (txId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await api.put(`/credit-cards/transactions/${txId}/move`, { direction: 'next' });
      presentToast({
        message: `Compra movida a la factura de ${MONTH_NAMES[res.month - 1]} ${res.year}`,
        duration: 2500,
        color: 'success',
        icon: checkmarkOutline
      });
      // Refresh invoices and current list
      if (selectedCard) {
        const invData = await api.get(`/credit-cards/${selectedCard.id}/invoices`);
        setInvoices(invData);
        handleInvoiceChange(selectedInvoiceId);
        fetchCards();
      }
    } catch (err) {
      console.error('Failed to move transaction', err);
      presentToast({
        message: 'No se pudo mover la transacción',
        duration: 2500,
        color: 'danger'
      });
    }
  };

  const handlePayInvoice = async () => {
    if (!selectedFundingAccount || !payAmount) return;
    try {
      await api.post(`/accounts/${selectedCard.id}/pay`, {
        funding_account_id: selectedFundingAccount,
        amount: parseFloat(payAmount),
        description: `Pago Tarjeta ${selectedCard.name}`
      });
      setShowPayModal(false);
      setSelectedCard(null);
      fetchCards();
      presentToast({
        message: 'Factura pagada exitosamente',
        duration: 2500,
        color: 'success'
      });
    } catch (err) {
      console.error('Failed to pay invoice', err);
    }
  };

  const selectedInvoice = invoices.find(inv => inv.id === selectedInvoiceId);

  return (
    <IonPage>
      <Header title="Tarjetas de Crédito" />
      <IonContent className="ion-padding">
        <div className="app-container">
          {loading ? (
            <div className="ion-text-center ion-margin-top"><IonSpinner name="crescent" color="primary" /></div>
          ) : cards.length > 0 ? (
            <IonList style={{ background: 'transparent' }}>
              {cards.map(card => {
                const progress = card.limit > 0 ? card.consumed / card.limit : 0;
                const color = progress > 0.8 ? 'danger' : progress > 0.5 ? 'warning' : 'success';
                return (
                  <IonItem key={card.id} button onClick={() => openCardDetails(card)} detail={false} className="glass-item ion-margin-bottom">
                    <div style={{ width: '100%', padding: '10px 0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <IonIcon icon={cardOutline} style={{ fontSize: '24px', color: `var(--ion-color-${color})` }} />
                          <div>
                            <h3 style={{ margin: 0, fontWeight: 600 }}>{card.name}</h3>
                            {card.network && <span style={{ fontSize: '11px', color: 'var(--ion-color-medium)' }}>{card.network}</span>}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontWeight: 700, fontSize: '18px', color: `var(--ion-color-${color})` }}>
                            ${card.consumed.toLocaleString()}
                          </span>
                          <div style={{ fontSize: '11px', color: 'var(--ion-color-medium)' }}>Factura actual</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--ion-color-medium)', marginBottom: '5px' }}>
                        <span>Límite: ${card.limit.toLocaleString()}</span>
                        <span>Disponible: ${(card.available).toLocaleString()}</span>
                      </div>
                      <IonProgressBar value={progress} color={color} style={{ height: '8px', borderRadius: '4px' }}></IonProgressBar>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--ion-color-medium)', marginTop: '8px' }}>
                        <span>Cierra: día {card.closing_day || '--'}</span>
                        <span>Vence: día {card.due_day || '--'}</span>
                      </div>
                    </div>
                  </IonItem>
                );
              })}
            </IonList>
          ) : (
            <div className="ion-text-center ion-padding" style={{ color: 'var(--ion-color-medium)' }}>
              <p>No tienes tarjetas de crédito registradas.</p>
            </div>
          )}

          {/* Modal Detalle de Tarjeta y Períodos de Facturación */}
          <IonModal isOpen={!!selectedCard} onDidDismiss={() => setSelectedCard(null)} className="glass-modal">
            <IonHeader className="ion-no-border">
              <IonToolbar style={{ '--background': 'transparent' }}>
                <IonTitle>{selectedCard?.name}</IonTitle>
                <IonButtons slot="end">
                  <IonButton onClick={() => setSelectedCard(null)}>
                    <IonIcon icon={closeOutline} />
                  </IonButton>
                </IonButtons>
              </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
              {/* Card Summary Banner */}
              <div className="glass-card ion-padding ion-text-center ion-margin-bottom gradient-primary">
                <p style={{ margin: 0, opacity: 0.85 }}>
                  {selectedInvoice ? `Factura de ${MONTH_NAMES[selectedInvoice.month - 1]} ${selectedInvoice.year}` : 'Factura Actual'}
                </p>
                <h2 style={{ fontSize: '34px', fontWeight: 700, margin: '8px 0' }}>
                  ${(selectedInvoice ? selectedInvoice.total_amount : selectedCard?.consumed)?.toLocaleString()}
                </h2>
                
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', margin: '8px 0' }}>
                  {selectedInvoice?.is_current && <IonChip color="light" style={{ height: '24px', fontSize: '11px' }}>Período Abierto</IonChip>}
                  {selectedInvoice?.status === 'paid' && <IonChip color="success" style={{ height: '24px', fontSize: '11px' }}>Factura Pagada</IonChip>}
                  {selectedInvoice?.status === 'closed' && <IonChip color="warning" style={{ height: '24px', fontSize: '11px' }}>Factura Cerrada</IonChip>}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '12px', opacity: 0.9, marginTop: '8px' }}>
                  <span>Corte: día {selectedCard?.closing_day || '--'}</span>
                  <span>Pago: día {selectedCard?.due_day || '--'}</span>
                </div>

                <IonButton expand="block" shape="round" color="light" className="ion-margin-top" style={{ fontWeight: 600, color: '#0f172a' }} onClick={() => setShowPayModal(true)} disabled={selectedCard?.consumed === 0}>
                  Pagar Factura
                </IonButton>
              </div>

              {/* Selector de Período / Factura */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '15px 0 10px 0' }}>
                <h3 style={{ fontWeight: 600, margin: 0 }}>Período de Facturación</h3>
                {invoices.length > 0 && (
                  <div style={{ minWidth: '160px' }}>
                    <IonSelect 
                      value={selectedInvoiceId} 
                      onIonChange={e => handleInvoiceChange(e.detail.value)}
                      interface="popover"
                      style={{ background: 'var(--ion-color-step-100, rgba(255,255,255,0.08))', borderRadius: '12px', padding: '4px 12px', fontSize: '13px', fontWeight: 600 }}
                    >
                      {invoices.map(inv => (
                        <IonSelectOption key={inv.id} value={inv.id}>
                          {MONTH_NAMES[inv.month - 1]} {inv.year} {inv.is_current ? ' (Actual)' : ''}
                        </IonSelectOption>
                      ))}
                      <IonSelectOption value="ALL">Ver Todos (Histórico)</IonSelectOption>
                    </IonSelect>
                  </div>
                )}
              </div>

              {/* Lista de Movimientos del Período */}
              {txLoading ? (
                <div className="ion-text-center ion-padding"><IonSpinner name="crescent" color="primary" /></div>
              ) : (
                <IonList style={{ background: 'transparent' }}>
                  {transactions.map(tx => (
                    <IonItem key={tx.id} lines="none" className="glass-item" style={{ marginBottom: '8px' }}>
                      <IonIcon icon={tx.paid ? checkmarkCircleOutline : ellipseOutline} slot="start" color={tx.paid ? 'success' : 'medium'} style={{ fontSize: '20px' }} />
                      <IonLabel>
                        <h2 style={{ fontWeight: 600 }}>{tx.description || tx.category_name}</h2>
                        <p style={{ fontSize: '12px', color: 'var(--ion-color-medium)' }}>
                          {tx.date.split('T')[0]} • {tx.category_name}
                        </p>
                      </IonLabel>
                      
                      <div slot="end" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                        <span style={{ fontWeight: 700, fontSize: '15px' }}>${tx.amount.toLocaleString()}</span>
                        
                        {/* Botón para mover a la siguiente factura */}
                        <IonButton 
                          fill="clear" 
                          size="small" 
                          color="primary" 
                          shape="round"
                          style={{ height: '24px', fontSize: '11px', margin: 0, textTransform: 'none' }}
                          onClick={(e) => handleMoveTransaction(tx.id, e)}
                          title="Mover al siguiente período de facturación"
                        >
                          <IonIcon icon={arrowForwardOutline} slot="end" style={{ fontSize: '13px' }} />
                          Siguiente factura
                        </IonButton>
                      </div>
                    </IonItem>
                  ))}
                  {transactions.length === 0 && (
                    <div className="ion-text-center ion-padding" style={{ color: 'var(--ion-color-medium)' }}>
                      <p>No hay movimientos en este período de facturación.</p>
                    </div>
                  )}
                </IonList>
              )}
            </IonContent>
          </IonModal>

          {/* Modal Pagar Tarjeta */}
          <IonModal isOpen={showPayModal} onDidDismiss={() => setShowPayModal(false)} className="glass-modal" initialBreakpoint={0.65} breakpoints={[0, 0.65, 0.9]}>
            <IonContent className="ion-padding">
              <h2 style={{ fontWeight: 700, marginBottom: '20px' }}>Pagar Tarjeta</h2>
              
              <IonItem className="glass-input" lines="none">
                <IonSelect value={selectedFundingAccount} onIonChange={e => setSelectedFundingAccount(e.detail.value)} label="Cuenta de Origen" labelPlacement="floating">
                  {fundingAccounts.map(acc => (
                    <IonSelectOption key={acc.id} value={acc.id}>{acc.name}</IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>

              <IonItem className="glass-input" lines="none">
                <IonInput type="number" value={payAmount} onIonInput={e => setPayAmount(e.detail.value!)} label="Monto a Pagar" labelPlacement="floating" />
              </IonItem>

              <IonButton expand="block" shape="round" className="ion-margin-top" style={{ height: '50px', '--background': 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)', fontWeight: 600, fontSize: '16px', marginTop: '24px' }} onClick={handlePayInvoice}>
                Confirmar Pago
              </IonButton>
            </IonContent>
          </IonModal>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default CreditCards;
