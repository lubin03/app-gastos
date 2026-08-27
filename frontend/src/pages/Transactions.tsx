import React, { useEffect, useState } from 'react';
import { IonContent, IonPage, IonFab, IonFabButton, IonIcon, IonSpinner, useIonViewWillEnter, IonButton, IonButtons, IonSegment, IonSegmentButton, IonLabel } from '@ionic/react';
import { useLocation, useHistory } from 'react-router-dom';
import { add, downloadOutline, pushOutline } from 'ionicons/icons';
import { api } from '../services/api';
import TransactionList from '../components/TransactionList';
import TransactionModal from '../components/TransactionModal';
import MagicModal from '../components/MagicModal';
import Header from '../components/Header';
import DateFilter from '../components/DateFilter';
import { useFilter } from '../context/FilterContext';
import { colorWandOutline, arrowBackOutline } from 'ionicons/icons';
import { useTranslation } from 'react-i18next';

const Transactions: React.FC = () => {
  const history = useHistory();
  const { startDate, endDate } = useFilter();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showMagic, setShowMagic] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [tab, setTab] = useState('all');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const filterAccountId = searchParams.get('accountId');
  const sharedText = searchParams.get('text') || searchParams.get('title') || searchParams.get('url');

  useEffect(() => {
    if (sharedText) {
      setShowMagic(true);
      // Clean up URL so it doesn't re-trigger on refresh
      const newParams = new URLSearchParams(location.search);
      newParams.delete('text');
      newParams.delete('title');
      newParams.delete('url');
      history.replace({
        pathname: location.pathname,
        search: newParams.toString()
      });
    }
  }, [sharedText, location.pathname, history, location.search]);

  const loadTransactions = async () => {
    try {
      const [txData, catData, accData] = await Promise.all([
        api.get(`/transactions?startDate=${startDate}&endDate=${endDate}`),
        api.get('/categories'),
        api.get('/accounts')
      ]);
      const ccIds = accData.filter((a: any) => a.type === 'credit_card').map((a: any) => a.id);

      let filteredTx = txData;
      if (filterAccountId) {
        filteredTx = filteredTx.filter((t: any) => t.account_id === filterAccountId);
      }

      const enriched = filteredTx.map((t: any) => {
        const cat = catData.find((c: any) => c.id === t.category_id);
        const isCc = ccIds.includes(t.account_id);
        return {
          ...t, 
          category: cat ? cat.name : 'Unknown',
          accountName: t.account_name,
          destinationAccountName: t.destination_account_name,
          paid: isCc ? t.paid : undefined 
        };
      });
      setTransactions(enriched);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useIonViewWillEnter(() => {
    loadTransactions();
  });

  React.useEffect(() => {
    loadTransactions();
  }, [startDate, endDate]);

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/transactions/export`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Transacciones.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error(err);
      alert('Error exporting transactions');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setIsUploading(true);
    try {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/transactions/import`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Import failed');
      }

      alert('Transactions imported successfully!');
      loadTransactions();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error importing transactions');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <IonPage>
      <Header title={t('transactions.title')} />
      <DateFilter />
      <IonContent>
        
        <div style={{ padding: '0 16px 16px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {filterAccountId ? (
            <IonButton size="small" fill="clear" shape="round" onClick={() => history.push('/app/accounts')} style={{ color: 'var(--ion-color-primary)', fontWeight: 600 }}>
              <IonIcon slot="start" icon={arrowBackOutline} />
              {t('transactions.backToAccount')}
            </IonButton>
          ) : <div />}
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <IonButton size="small" fill="outline" shape="round" onClick={handleExport} style={{ color: 'var(--ion-color-primary)', fontWeight: 600 }}>
              <IonIcon slot="start" icon={downloadOutline} />
              {t('transactions.export')}
            </IonButton>
            <input 
              type="file" 
              accept=".xlsx" 
              style={{ display: 'none' }} 
              ref={fileInputRef} 
              onChange={handleImport} 
            />
            <IonButton size="small" shape="round" onClick={() => fileInputRef.current?.click()} disabled={isUploading} style={{ '--background': 'rgba(var(--ion-color-primary-rgb), 0.1)', color: 'var(--ion-color-primary)', fontWeight: 600, boxShadow: 'none' }} fill="clear">
              {isUploading ? <IonSpinner name="dots" /> : <><IonIcon slot="start" icon={pushOutline} /> {t('transactions.import')}</>}
            </IonButton>
          </div>
        </div>

        <div className="ion-padding-horizontal">
          <IonSegment value={tab} onIonChange={e => setTab(e.detail.value as string)} mode="ios" style={{ marginBottom: '16px' }}>
            <IonSegmentButton value="all">
              <IonLabel>Total</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="pending">
              <IonLabel>Pendientes</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="paid">
              <IonLabel>Pagos</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </div>

        <div style={{ paddingBottom: '140px' }}>
          {loading ? <IonSpinner className="ion-margin" /> : (
            <TransactionList 
              transactions={transactions.filter(t => {
                if (tab === 'pending') return t.paid === false;
                if (tab === 'paid') return t.paid === true;
                return true;
              })} 
              onEdit={(t) => {
                setEditingTransaction(t);
                setShowModal(true);
              }} 
            />
          )}
        </div>

        <IonFab vertical="bottom" horizontal="end" slot="fixed" style={{ marginBottom: '80px', marginRight: '8px' }}>
          <IonFabButton onClick={() => setShowMagic(true)} style={{ '--background': 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)' }}>
            <IonIcon icon={colorWandOutline} />
          </IonFabButton>
        </IonFab>

        <IonFab vertical="bottom" horizontal="end" slot="fixed" style={{ marginBottom: '16px', marginRight: '8px' }}>
          <IonFabButton onClick={() => setShowModal(true)}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>

        <TransactionModal 
          isOpen={showModal} 
          transaction={editingTransaction}
          onClose={() => {
            setShowModal(false);
            setEditingTransaction(null);
          }} 
          onSaved={() => {
            setShowModal(false);
            setEditingTransaction(null);
            loadTransactions();
          }} 
        />
        
        <MagicModal
          isOpen={showMagic}
          onClose={() => setShowMagic(false)}
          onSuccess={() => {
            setShowMagic(false);
            loadTransactions();
          }}
          initialText={sharedText || undefined}
        />
      </IonContent>
    </IonPage>
  );
};

export default Transactions;
