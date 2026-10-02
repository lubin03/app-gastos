import React, { useState } from 'react';
import { 
  IonContent, IonPage, IonList, IonItem, IonLabel, IonSpinner, IonIcon, 
  useIonViewWillEnter, IonProgressBar, IonModal, IonButton, IonHeader, 
  IonToolbar, IonTitle, IonButtons, IonSelect, IonSelectOption, IonInput,
  IonBadge, IonChip, useIonToast, IonAccordionGroup, IonAccordion, IonCheckbox
} from '@ionic/react';
import { 
  cardOutline, closeOutline, checkmarkCircleOutline, ellipseOutline, 
  arrowForwardOutline, arrowBackOutline, calendarOutline, cashOutline, timeOutline, checkmarkOutline,
  pencilOutline
} from 'ionicons/icons';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';
import { api, useDataSync } from '../services/api';
import AmountInput from '../components/AmountInput';

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
  const [transactions, setTransactions] = useState<any[]>([]);
  const [txLoading, setTxLoading] = useState(false);
  
  // Payment Modal state
  const [showPayModal, setShowPayModal] = useState(false);
  const [fundingAccounts, setFundingAccounts] = useState<any[]>([]);
  const [selectedFundingAccount, setSelectedFundingAccount] = useState<string>('');
  const [payAmount, setPayAmount] = useState<string>('');
  const [payDate, setPayDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Edit Transaction Modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTx, setEditingTx] = useState<any>(null);
  const [editAmount, setEditAmount] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');
  const [editApplyToRemaining, setEditApplyToRemaining] = useState<boolean>(false);
  const [editSaving, setEditSaving] = useState(false);

  useIonViewWillEnter(() => {
    fetchCards();
    fetchAccounts();
  });

  useDataSync(['creditCards', 'accounts', 'transactions'], () => {
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

      // 2. Fetch ALL transactions for this card
      const txData = await api.get(`/credit-cards/${card.id}/transactions?all=true`);
      setTransactions(txData);
    } catch (err) {
      console.error('Failed to load card details', err);
    } finally {
      setTxLoading(false);
    }
  };



  const handleMoveTransaction = async (txId: string, direction: 'prev' | 'next', e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await api.put(`/credit-cards/transactions/${txId}/move`, { direction });
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
        
        // Refresh all transactions
        const txData = await api.get(`/credit-cards/${selectedCard.id}/transactions?all=true`);
        setTransactions(txData);
        
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

  const handleTogglePaid = async (tx: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedCard) return;
    try {
      await api.patch(`/credit-cards/${selectedCard.id}/transactions/${tx.id}/toggle-paid`, {});
      const [invData, txData] = await Promise.all([
        api.get(`/credit-cards/${selectedCard.id}/invoices`),
        api.get(`/credit-cards/${selectedCard.id}/transactions?all=true`)
      ]);
      setInvoices(invData);
      setTransactions(txData);
      fetchCards();
    } catch (err) {
      console.error('Failed to toggle paid status', err);
      presentToast({
        message: 'No se pudo cambiar el estado de pago',
        duration: 2500,
        color: 'danger'
      });
    }
  };

  const handleOpenEdit = (tx: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTx(tx);
    setEditAmount(tx.amount.toString());
    setEditDescription(tx.description || '');
    setEditApplyToRemaining(false);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingTx || !selectedCard) return;
    try {
      setEditSaving(true);
      const parsedAmount = parseFloat(editAmount);
      if (isNaN(parsedAmount)) {
        presentToast({ message: 'Ingrese un monto válido', duration: 2500, color: 'warning' });
        return;
      }
      
      // Update this transaction
      await api.put(`/transactions/${editingTx.id}`, {
        amount: parsedAmount,
        description: editDescription
      });

      // If apply to remaining is checked, bulk update remaining unpaid installments
      if (editApplyToRemaining && (editingTx.parent_transaction_id || (editingTx.installment_total && editingTx.installment_total > 1))) {
        const parentId = editingTx.parent_transaction_id || editingTx.id;
        await api.put(`/credit-cards/installments/${parentId}/bulk-update`, {
          amount: parsedAmount
        });
      }

      setShowEditModal(false);
      presentToast({
        message: 'Transacción actualizada correctamente',
        duration: 2500,
        color: 'success',
        icon: checkmarkOutline
      });

      const [invData, txData] = await Promise.all([
        api.get(`/credit-cards/${selectedCard.id}/invoices`),
        api.get(`/credit-cards/${selectedCard.id}/transactions?all=true`)
      ]);
      setInvoices(invData);
      setTransactions(txData);
      fetchCards();
    } catch (err) {
      console.error('Failed to update transaction', err);
      presentToast({
        message: 'Error al actualizar la transacción',
        duration: 2500,
        color: 'danger'
      });
    } finally {
      setEditSaving(false);
    }
  };

  const [selectedInvoiceToPay, setSelectedInvoiceToPay] = useState<string>('');

  const handlePayInvoice = async () => {
    if (!selectedFundingAccount || !payAmount || !selectedInvoiceToPay) {
      presentToast({ message: 'Seleccione una cuenta origen, monto y desde el botón de la factura', duration: 2500, color: 'warning' });
      return;
    }
    try {
      await api.post(`/accounts/${selectedCard.id}/pay`, {
        invoice_id: selectedInvoiceToPay,
        funding_account_id: selectedFundingAccount,
        amount: parseFloat(payAmount),
        date: payDate,
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

  const transactionsByInvoice = React.useMemo(() => {
    const map: Record<string, any[]> = {};
    invoices.forEach(inv => {
      map[inv.id] = transactions.filter(tx => tx.invoice_id === inv.id || (inv.is_current && tx.invoice_id === null));
    });
    return map;
  }, [transactions, invoices]);

  // Current invoice for the banner
  const currentInvoice = invoices.find(inv => inv.is_current) || invoices[0];

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
                  {currentInvoice ? `Factura de ${MONTH_NAMES[currentInvoice.month - 1]} ${currentInvoice.year}` : 'Factura Actual'}
                </p>
                <h2 style={{ fontSize: '34px', fontWeight: 700, margin: '8px 0' }}>
                  ${(currentInvoice ? currentInvoice.total_amount : selectedCard?.consumed)?.toLocaleString()}
                </h2>
                
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', margin: '8px 0' }}>
                  {currentInvoice?.is_current && <IonChip color="light" style={{ height: '24px', fontSize: '11px' }}>Período Abierto</IonChip>}
                  {currentInvoice?.status === 'paid' && <IonChip color="success" style={{ height: '24px', fontSize: '11px' }}>Factura Pagada</IonChip>}
                  {currentInvoice?.status === 'closed' && <IonChip color="warning" style={{ height: '24px', fontSize: '11px' }}>Factura Cerrada</IonChip>}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '12px', opacity: 0.9, marginTop: '8px' }}>
                  <span>Corte: día {selectedCard?.closing_day || '--'}</span>
                  <span>Pago: día {selectedCard?.due_day || '--'}</span>
                </div>

                <IonButton 
                  expand="block" 
                  shape="round" 
                  color="light" 
                  className="ion-margin-top" 
                  style={{ fontWeight: 600, color: '#0f172a' }} 
                  onClick={() => {
                    if (currentInvoice) {
                      setSelectedInvoiceToPay(currentInvoice.id);
                      const unpaid = Math.max(0, currentInvoice.total_amount - currentInvoice.paid_amount);
                      setPayAmount(unpaid > 0 ? unpaid.toString() : (selectedCard?.consumed || 0).toString());
                    }
                    setPayDate(new Date().toISOString().split('T')[0]);
                    setShowPayModal(true);
                  }} 
                  disabled={selectedCard?.consumed === 0 && (!currentInvoice || currentInvoice.total_amount === 0)}
                >
                  Pagar Factura
                </IonButton>
              </div>

              {txLoading ? (
                <div className="ion-text-center ion-padding"><IonSpinner name="crescent" color="primary" /></div>
              ) : (
                <>
                  <h3 style={{ fontWeight: 600, margin: '15px 0 10px 0' }}>Períodos de Facturación</h3>
                  
                  <IonAccordionGroup>
                    {invoices.map(inv => (
                      <IonAccordion key={inv.id} value={inv.id} style={{ background: 'var(--ion-color-step-100, rgba(255,255,255,0.08))', borderRadius: '12px', marginBottom: '8px' }}>
                        <IonItem slot="header" color="transparent" lines="none">
                          <IonLabel>
                            <h2 style={{ fontWeight: 600 }}>{MONTH_NAMES[inv.month - 1]} {inv.year}</h2>
                            <p style={{ fontSize: '12px', color: 'var(--ion-color-medium)' }}>
                              Total: ${inv.total_amount.toLocaleString()}
                              {((inv.unpaid_amount !== undefined ? inv.unpaid_amount : (inv.total_amount - inv.paid_amount)) > 0) && (
                                <span style={{ color: 'var(--ion-color-warning)', fontWeight: 600, marginLeft: '8px' }}>
                                  • Pendiente: ${(inv.unpaid_amount !== undefined ? inv.unpaid_amount : (inv.total_amount - inv.paid_amount)).toLocaleString()}
                                </span>
                              )}
                            </p>
                          </IonLabel>
                          <div slot="end" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {inv.is_current && <IonBadge color="primary">Actual</IonBadge>}
                            {(inv.status === 'paid' || (inv.total_amount > 0 && inv.paid_amount >= inv.total_amount)) && <IonBadge color="success">Pagado</IonBadge>}
                            {(inv.status === 'partial' || (inv.paid_amount > 0 && inv.paid_amount < inv.total_amount)) && <IonBadge color="warning">Parcial</IonBadge>}
                            {inv.status === 'closed' && inv.paid_amount < inv.total_amount && <IonBadge color="medium">Cerrado</IonBadge>}
                          </div>
                        </IonItem>
                        
                        <div className="ion-padding" slot="content" style={{ background: 'transparent' }}>
                          {inv.status !== 'paid' && (inv.total_amount === 0 || inv.paid_amount < inv.total_amount) && (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
                              <IonButton size="small" shape="round" onClick={() => {
                                setSelectedInvoiceToPay(inv.id);
                                const unpaid = Math.max(0, inv.total_amount - inv.paid_amount);
                                setPayAmount(unpaid.toString());
                                setPayDate(new Date().toISOString().split('T')[0]);
                                setShowPayModal(true);
                              }}>
                                Pagar esta factura
                              </IonButton>
                            </div>
                          )}

                          <IonList style={{ background: 'transparent' }}>
                            {(transactionsByInvoice[inv.id] || []).map(tx => (
                              <IonItem key={tx.id} lines="none" className="glass-item" style={{ marginBottom: '8px' }}>
                                <div 
                                  onClick={(e) => handleTogglePaid(tx, e)}
                                  style={{ cursor: 'pointer', padding: '6px', marginRight: '6px', display: 'flex', alignItems: 'center' }}
                                  title={tx.paid ? 'Marcar como pendiente' : 'Marcar como pagado'}
                                >
                                  <IonIcon 
                                    icon={tx.paid ? checkmarkCircleOutline : ellipseOutline} 
                                    color={tx.paid ? 'success' : 'medium'} 
                                    style={{ fontSize: '22px' }} 
                                  />
                                </div>
                                <IonLabel>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                    <h2 style={{ fontWeight: 600, margin: 0 }}>{tx.description || tx.category_name}</h2>
                                    {tx.installment_total && tx.installment_total > 1 && (
                                      <IonBadge color="secondary" style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px' }}>
                                        Cuota {tx.installment_current || 1}/{tx.installment_total}
                                      </IonBadge>
                                    )}
                                  </div>
                                  <p style={{ fontSize: '12px', color: 'var(--ion-color-medium)', marginTop: '2px' }}>
                                    {tx.date.split('T')[0]} • {tx.category_name}
                                  </p>
                                </IonLabel>
                                
                                <div slot="end" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                  <span style={{ fontWeight: 700, fontSize: '15px' }}>${tx.amount.toLocaleString()}</span>
                                  
                                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                    <IonButton 
                                      fill="clear" 
                                      size="small" 
                                      color="medium" 
                                      shape="round"
                                      style={{ height: '24px', fontSize: '11px', margin: 0, padding: '0 4px', textTransform: 'none' }}
                                      onClick={(e) => handleOpenEdit(tx, e)}
                                      title="Editar valor / descripción"
                                    >
                                      <IonIcon icon={pencilOutline} slot="icon-only" style={{ fontSize: '14px' }} />
                                    </IonButton>

                                    <IonButton 
                                      fill="clear" 
                                      size="small" 
                                      color="primary" 
                                      shape="round"
                                      style={{ height: '24px', fontSize: '11px', margin: 0, padding: '0 4px', textTransform: 'none' }}
                                      onClick={(e) => handleMoveTransaction(tx.id, 'prev', e)}
                                      title="Mover al corte anterior"
                                    >
                                      <IonIcon icon={arrowBackOutline} slot="icon-only" style={{ fontSize: '13px' }} />
                                    </IonButton>

                                    <IonButton 
                                      fill="clear" 
                                      size="small" 
                                      color="primary" 
                                      shape="round"
                                      style={{ height: '24px', fontSize: '11px', margin: 0, padding: '0 4px', textTransform: 'none' }}
                                      onClick={(e) => handleMoveTransaction(tx.id, 'next', e)}
                                      title="Mover al siguiente corte"
                                    >
                                      <IonIcon icon={arrowForwardOutline} slot="icon-only" style={{ fontSize: '13px' }} />
                                    </IonButton>
                                  </div>
                                </div>
                              </IonItem>
                            ))}
                            {(transactionsByInvoice[inv.id] || []).length === 0 && (
                              <div className="ion-text-center" style={{ color: 'var(--ion-color-medium)', padding: '10px' }}>
                                <p>No hay movimientos en este período.</p>
                              </div>
                            )}
                          </IonList>
                        </div>
                      </IonAccordion>
                    ))}
                  </IonAccordionGroup>
                </>
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

              <AmountInput 
                value={payAmount} 
                onChange={val => setPayAmount(val)} 
                label="Monto a Pagar" 
              />

              <IonItem className="glass-input" lines="none">
                <IonInput type="date" value={payDate} onIonInput={e => setPayDate(e.detail.value!)} label="Fecha de Pago" labelPlacement="floating" />
              </IonItem>

              <IonButton expand="block" shape="round" className="ion-margin-top" style={{ height: '50px', '--background': 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)', fontWeight: 600, fontSize: '16px', marginTop: '24px' }} onClick={handlePayInvoice}>
                Confirmar Pago
              </IonButton>
            </IonContent>
          </IonModal>

          {/* Modal Editar Transacción de Tarjeta */}
          <IonModal 
            isOpen={showEditModal} 
            onDidDismiss={() => setShowEditModal(false)} 
            className="glass-modal" 
            initialBreakpoint={0.65} 
            breakpoints={[0, 0.65, 0.85]}
          >
            <IonContent className="ion-padding">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontWeight: 700, margin: 0 }}>Editar Movimiento</h2>
                <IonButton fill="clear" onClick={() => setShowEditModal(false)}>
                  <IonIcon icon={closeOutline} />
                </IonButton>
              </div>

              {editingTx?.installment_total && editingTx.installment_total > 1 && (
                <div style={{ marginBottom: '16px' }}>
                  <IonChip color="secondary">
                    Cuota {editingTx.installment_current || 1} de {editingTx.installment_total}
                  </IonChip>
                </div>
              )}

              <AmountInput 
                value={editAmount} 
                onChange={val => setEditAmount(val)} 
                label="Valor de la Cuota" 
              />

              <IonItem className="glass-input ion-margin-top" lines="none">
                <IonInput 
                  value={editDescription} 
                  onIonInput={e => setEditDescription(e.detail.value!)} 
                  label="Descripción" 
                  labelPlacement="floating" 
                  placeholder="Descripción del gasto"
                />
              </IonItem>

              {editingTx?.installment_total && editingTx.installment_total > 1 && (
                <IonItem lines="none" style={{ marginTop: '12px', '--background': 'transparent' }}>
                  <IonCheckbox 
                    checked={editApplyToRemaining} 
                    onIonChange={e => setEditApplyToRemaining(e.detail.checked)}
                    justify="start"
                    style={{ fontSize: '14px' }}
                  >
                    Aplicar este valor a las cuotas restantes pendientes
                  </IonCheckbox>
                </IonItem>
              )}

              <IonButton 
                expand="block" 
                shape="round" 
                className="ion-margin-top" 
                style={{ height: '50px', '--background': 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)', fontWeight: 600, fontSize: '16px', marginTop: '24px' }} 
                onClick={handleSaveEdit}
                disabled={editSaving || !editAmount}
              >
                {editSaving ? <IonSpinner name="crescent" /> : 'Guardar Cambios'}
              </IonButton>
            </IonContent>
          </IonModal>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default CreditCards;
