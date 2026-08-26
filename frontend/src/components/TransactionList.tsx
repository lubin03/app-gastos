import React from 'react';
import { IonList, IonItem, IonLabel, IonText, IonIcon } from '@ionic/react';
import { trendingDownOutline, trendingUpOutline, swapHorizontalOutline } from 'ionicons/icons';
import { useTranslation } from 'react-i18next';

interface Transaction {
  id: string;
  amount: string;
  category: string;
  category_id: string;
  account_id: string;
  date: string;
  description: string;
  type: 'income' | 'expense' | 'transfer';
  paid?: boolean;
  accountName?: string;
  destinationAccountName?: string;
}

interface Props {
  transactions: Transaction[];
  onEdit: (t: Transaction) => void;
}

const TransactionList: React.FC<Props> = ({ transactions, onEdit }) => {
  const { t } = useTranslation();
  if (transactions.length === 0) {
    return (
      <div className="ion-text-center ion-padding" style={{ opacity: 0.5, marginTop: '20px' }}>
        <p>{t('transactions.noTransactions')}</p>
      </div>
    );
  }

  const getIcon = (type: string) => {
    if (type === 'income') return trendingUpOutline;
    if (type === 'transfer') return swapHorizontalOutline;
    return trendingDownOutline;
  };

  const sortedTxs = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  const groupedTransactions = sortedTxs.reduce((acc: any, t) => {
    const dateStr = new Date(t.date).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' });
    if (!acc[dateStr]) acc[dateStr] = { txs: [], total: 0 };
    acc[dateStr].txs.push(t);
    
    const amount = parseFloat(t.amount);
    if (t.type === 'expense') acc[dateStr].total -= amount;
    if (t.type === 'income') acc[dateStr].total += amount;
    
    return acc;
  }, {});

  return (
    <>
      {Object.entries(groupedTransactions).map(([date, data]: any) => (
        <div key={date}>
          <div style={{ display: 'flex', justifyContent: 'space-between', margin: '20px 16px 10px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>
            <IonText color="medium" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'capitalize' }}>{date}</IonText>
            <IonText color={data.total < 0 ? 'danger' : 'success'} style={{ fontSize: '12px', fontWeight: 600 }}>
              {data.total < 0 ? '' : '+'}${data.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </IonText>
          </div>
          <IonList className="ion-padding-horizontal" style={{ background: 'transparent', paddingBottom: 0, paddingTop: 0 }}>
            {data.txs.map((tx: any) => (
              <IonItem key={tx.id} button onClick={() => onEdit(tx)} className="glass-item" lines="none" style={{ marginBottom: '8px' }}>
                <div slot="start" className={`list-avatar ${tx.type}`}>
                  <IonIcon icon={getIcon(tx.type)} />
                </div>
                <IonLabel>
                  <h2 style={{ fontWeight: 600, fontSize: '16px', color: '#fff', marginBottom: '4px' }}>
                    {tx.description || tx.category}
                  </h2>
                  <p style={{ fontSize: '12px', color: '#94a3b8' }}>
                    {tx.type === 'transfer' ? (
                      `${tx.accountName || 'Cuenta'} ➔ ${tx.destinationAccountName || 'Destino'}`
                    ) : (
                      `${tx.category} | ${tx.accountName || 'Cuenta'}`
                    )}
                  </p>
                  {tx.paid !== undefined && (
                    <IonText color={tx.paid ? 'success' : 'warning'} style={{ fontSize: '11px', fontWeight: 600, display: 'inline-block', marginTop: '4px', padding: '2px 6px', background: tx.paid ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', borderRadius: '4px' }}>
                      {tx.paid ? t('common.paid', 'Pagado') : t('common.pending', 'Pendiente')}
                    </IonText>
                  )}
                </IonLabel>
                <IonText 
                  slot="end" 
                  style={{ 
                    fontWeight: 700, 
                    fontSize: '16px',
                    color: tx.type === 'income' ? '#10b981' : (tx.type === 'expense' ? '#f43f5e' : '#a855f7') 
                  }}
                >
                  {tx.type === 'income' ? '+' : '-'}${parseFloat(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </IonText>
              </IonItem>
            ))}
          </IonList>
        </div>
      ))}
    </>
  );
};

export default TransactionList;
