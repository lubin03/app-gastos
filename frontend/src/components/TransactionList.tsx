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

  return (
    <IonList className="ion-padding-horizontal" style={{ background: 'transparent' }}>
      {transactions.map(tx => (
        <IonItem key={tx.id} button onClick={() => onEdit(tx)} className="glass-item" lines="none">
          <div slot="start" className={`list-avatar ${tx.type}`}>
            <IonIcon icon={getIcon(tx.type)} />
          </div>
          <IonLabel>
            <h2 style={{ fontWeight: 600, fontSize: '16px', color: '#fff', marginBottom: '4px' }}>
              {tx.description || tx.category}
            </h2>
            <p style={{ fontSize: '12px', color: '#94a3b8' }}>
              {new Date(tx.date).toLocaleDateString()} - {tx.category}
            </p>
            {tx.paid !== undefined && (
              <IonText color={tx.paid ? 'success' : 'warning'} style={{ fontSize: '11px', fontWeight: 600, display: 'inline-block', marginTop: '4px', padding: '2px 6px', background: tx.paid ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', borderRadius: '4px' }}>
                {tx.paid ? t('common.paid') : t('common.pending')}
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
  );
};

export default TransactionList;
