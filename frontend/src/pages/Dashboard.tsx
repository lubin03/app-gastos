import React, { useState } from 'react';
import { IonContent, IonPage, IonGrid, IonRow, IonCol, IonSpinner, IonIcon, useIonViewWillEnter, IonText } from '@ionic/react';
import { walletOutline, trendingUpOutline, trendingDownOutline, cardOutline } from 'ionicons/icons';
import { useAuth } from '../context/AuthContext';
import { useFilter } from '../context/FilterContext';
import { api } from '../services/api';
import Header from '../components/Header';
import DateFilter from '../components/DateFilter';
import { useTranslation } from 'react-i18next';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { startDate, endDate } = useFilter();
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState({ bankTotal: 0, ccDebt: 0, income: 0, expense: 0 });
  const { t } = useTranslation();

  useIonViewWillEnter(() => {
    fetchDashboardData();
  });

  // Re-fetch when dates change
  React.useEffect(() => {
    fetchDashboardData();
  }, [startDate, endDate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await api.get(`/dashboard?startDate=${startDate}&endDate=${endDate}`);
      setBalance({ 
        bankTotal: data.bankTotal || 0, 
        ccDebt: data.ccDebt || 0, 
        income: data.income || 0, 
        expense: data.expense || 0 
      });
    } catch (err) {
      console.error('Failed to load dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <Header title={t('dashboard.title')} />
      <DateFilter />
      <IonContent className="ion-padding">
        <div className="ion-margin-bottom">
          <IonText color="medium">
            <p style={{ margin: 0, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('dashboard.welcome')}</p>
          </IonText>
          <h1 style={{ margin: '5px 0 20px 0', fontWeight: 700, fontSize: '28px' }} className="text-gradient">
            {user?.name || user?.email}
          </h1>
        </div>
        
        {loading ? (
          <div className="ion-text-center ion-margin-top"><IonSpinner name="crescent" color="primary" /></div>
        ) : (
          <IonGrid className="ion-no-padding">
            <IonRow>
              <IonCol size="12">
                <div className="glass-card gradient-primary ion-padding" style={{ position: 'relative' }}>
                  <IonIcon icon={walletOutline} style={{ position: 'absolute', right: '-20px', bottom: '-20px', fontSize: '120px', opacity: 0.15 }} />
                  <p style={{ margin: 0, opacity: 0.8, fontSize: '14px', fontWeight: 500 }}>{t('dashboard.bankBalance')}</p>
                  <h2 style={{ margin: '10px 0 0 0', fontSize: '42px', fontWeight: 700 }}>
                    ${balance.bankTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h2>
                </div>
              </IonCol>
              
              <IonCol size="12" className="ion-margin-top">
                <div className="glass-card gradient-warning ion-padding" style={{ position: 'relative' }}>
                  <IonIcon icon={cardOutline} style={{ position: 'absolute', right: '-10px', bottom: '-10px', fontSize: '100px', opacity: 0.15 }} />
                  <p style={{ margin: 0, opacity: 0.8, fontSize: '14px', fontWeight: 500 }}>{t('dashboard.ccDebt')}</p>
                  <h2 style={{ margin: '5px 0 0 0', fontSize: '28px', fontWeight: 600 }}>
                    ${balance.ccDebt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h2>
                </div>
              </IonCol>

              <IonCol size="6" className="ion-padding-top" style={{ paddingRight: '8px' }}>
                <div className="glass-card ion-padding" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <IonIcon icon={trendingUpOutline} style={{ color: '#10b981', fontSize: '24px', marginBottom: '8px' }} />
                  <p style={{ margin: 0, fontSize: '12px', color: '#10b981', fontWeight: 500 }}>{t('dashboard.income')}</p>
                  <h3 style={{ margin: '5px 0 0 0', fontSize: '18px', fontWeight: 600, color: '#10b981' }}>
                    ${balance.income.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h3>
                </div>
              </IonCol>
              
              <IonCol size="6" className="ion-padding-top" style={{ paddingLeft: '8px' }}>
                <div className="glass-card ion-padding" style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.2)' }}>
                  <IonIcon icon={trendingDownOutline} style={{ color: '#f43f5e', fontSize: '24px', marginBottom: '8px' }} />
                  <p style={{ margin: 0, fontSize: '12px', color: '#f43f5e', fontWeight: 500 }}>{t('dashboard.expenses')}</p>
                  <h3 style={{ margin: '5px 0 0 0', fontSize: '18px', fontWeight: 600, color: '#f43f5e' }}>
                    ${balance.expense.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h3>
                </div>
              </IonCol>
            </IonRow>
          </IonGrid>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Dashboard;
