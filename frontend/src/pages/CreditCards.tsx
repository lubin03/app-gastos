import React, { useState, useEffect } from 'react';
import { IonContent, IonPage, IonList, IonItem, IonLabel, IonSpinner, IonIcon, useIonViewWillEnter, IonProgressBar, IonModal, IonButton, IonHeader, IonToolbar, IonTitle, IonButtons, IonSelect, IonSelectOption, IonInput } from '@ionic/react';
import { cardOutline, closeOutline, checkmarkCircleOutline, ellipseOutline } from 'ionicons/icons';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';
import { api } from '../services/api';

const CreditCards: React.FC = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<any[]>([]);
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [txLoading, setTxLoading] = useState(false);
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
      const data = await api.get(`/credit-cards/${card.id}/transactions`);
      setTransactions(data);
    } catch (err) {
      console.error('Failed to load card transactions', err);
    } finally {
      setTxLoading(false);
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
    } catch (err) {
      console.error('Failed to pay invoice', err);
    }
  };

  return (
    <IonPage>
      <Header title="Tarjetas de Crédito" />
      <IonContent className="ion-padding">
        {loading ? (
          <div className="ion-text-center ion-margin-top"><IonSpinner name="crescent" color="primary" /></div>
        ) : cards.length > 0 ? (
          <IonList className="glass-list">
            {cards.map(card => {
              const progress = card.limit > 0 ? card.consumed / card.limit : 0;
              const color = progress > 0.8 ? 'danger' : progress > 0.5 ? 'warning' : 'success';
              return (
                <IonItem key={card.id} button onClick={() => openCardDetails(card)} detail={false} className="ion-margin-bottom" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                  <div style={{ width: '100%', padding: '10px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <IonIcon icon={cardOutline} style={{ fontSize: '24px', color: `var(--ion-color-${color})` }} />
                        <h3 style={{ margin: 0, fontWeight: 600 }}>{card.name}</h3>
                      </div>
                      <span style={{ fontWeight: 700, fontSize: '18px', color: `var(--ion-color-${color})` }}>
                        ${card.consumed.toLocaleString()}
                      </span>
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

        <IonModal isOpen={!!selectedCard} onDidDismiss={() => setSelectedCard(null)}>
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
            <div className="glass-card ion-padding ion-text-center ion-margin-bottom gradient-primary">
              <p style={{ margin: 0, opacity: 0.8 }}>Factura Actual (Deuda)</p>
              <h2 style={{ fontSize: '36px', fontWeight: 700, margin: '10px 0' }}>${selectedCard?.consumed?.toLocaleString()}</h2>
              <IonButton expand="block" color="light" className="ion-margin-top" onClick={() => setShowPayModal(true)} disabled={selectedCard?.consumed === 0}>
                Pagar Factura
              </IonButton>
            </div>

            <h3 style={{ fontWeight: 600, margin: '20px 0 10px 0' }}>Movimientos</h3>
            {txLoading ? (
              <div className="ion-text-center"><IonSpinner /></div>
            ) : (
              <IonList className="glass-list">
                {transactions.map(tx => (
                  <IonItem key={tx.id} lines="full">
                    <IonIcon icon={tx.paid ? checkmarkCircleOutline : ellipseOutline} slot="start" color={tx.paid ? 'success' : 'medium'} />
                    <IonLabel>
                      <h2>{tx.description || tx.category_name}</h2>
                      <p>{tx.date.split('T')[0]}</p>
                    </IonLabel>
                    <span slot="end" style={{ fontWeight: 600 }}>${tx.amount.toLocaleString()}</span>
                  </IonItem>
                ))}
                {transactions.length === 0 && <p className="ion-text-center ion-padding">No hay movimientos.</p>}
              </IonList>
            )}
          </IonContent>
        </IonModal>

        <IonModal isOpen={showPayModal} onDidDismiss={() => setShowPayModal(false)} initialBreakpoint={0.6} breakpoints={[0, 0.6, 0.8]}>
          <IonContent className="ion-padding">
            <h2 style={{ fontWeight: 700, marginBottom: '20px' }}>Pagar Tarjeta</h2>
            
            <IonItem className="glass-item ion-margin-bottom">
              <IonLabel position="stacked">Cuenta de Origen</IonLabel>
              <IonSelect value={selectedFundingAccount} onIonChange={e => setSelectedFundingAccount(e.detail.value)} placeholder="Seleccionar cuenta">
                {fundingAccounts.map(acc => (
                  <IonSelectOption key={acc.id} value={acc.id}>{acc.name}</IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>

            <IonItem className="glass-item ion-margin-bottom">
              <IonLabel position="stacked">Monto a Pagar</IonLabel>
              <IonInput type="number" value={payAmount} onIonChange={e => setPayAmount(e.detail.value!)} />
            </IonItem>

            <IonButton expand="block" className="gradient-primary" onClick={handlePayInvoice}>
              Confirmar Pago
            </IonButton>
          </IonContent>
        </IonModal>

      </IonContent>
    </IonPage>
  );
};

export default CreditCards;
