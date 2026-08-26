import React, { useEffect, useState } from 'react';
import { IonContent, IonPage, IonGrid, IonRow, IonCol, IonSpinner, IonIcon, IonText, IonProgressBar, useIonViewWillEnter, IonButton, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle } from '@ionic/react';
import { warningOutline, trendingUpOutline, trendingDownOutline, alertCircleOutline, checkmarkCircleOutline } from 'ionicons/icons';
import { useFilter } from '../context/FilterContext';
import { api } from '../services/api';
import DateFilter from '../components/DateFilter';
import { useTranslation } from 'react-i18next';

const Insights: React.FC = () => {
  const { startDate, endDate } = useFilter();
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<any>(null);
  const { t } = useTranslation();

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const data = await api.get(`/insights?startDate=${startDate}&endDate=${endDate}`);
      setInsights(data);
    } catch (err) {
      console.error('Failed to load insights', err);
    } finally {
      setLoading(false);
    }
  };

  useIonViewWillEnter(() => {
    fetchInsights();
  });

  useEffect(() => {
    fetchInsights();
  }, [startDate, endDate]);

  return (
    <IonPage>
      <IonHeader className="ion-no-border glass-header">
        <IonToolbar style={{ '--background': 'transparent' }}>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/app/dashboard" color="dark" />
          </IonButtons>
          <IonTitle style={{ fontWeight: 700, fontSize: '20px' }}>Mi Actuación</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <DateFilter />
      
      <IonContent className="ion-padding">
        {loading || !insights ? (
          <div className="ion-text-center ion-margin-top"><IonSpinner name="crescent" color="primary" /></div>
        ) : (
          <IonGrid className="ion-no-padding">
            <IonRow>
              
              {/* Ratio de Ingresos Gastados */}
              <IonCol size="12" className="ion-margin-bottom">
                <div className="glass-card ion-padding" style={{ borderLeft: insights.ratios.expenseToIncome > 90 ? '4px solid #ef4444' : '4px solid #10b981' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Tasa de Gasto</h3>
                    <IonIcon icon={insights.ratios.expenseToIncome > 90 ? alertCircleOutline : checkmarkCircleOutline} style={{ color: insights.ratios.expenseToIncome > 90 ? '#ef4444' : '#10b981', fontSize: '24px' }} />
                  </div>
                  <p style={{ fontSize: '14px', color: 'var(--ion-color-medium)' }}>Porcentaje de ingresos gastados este mes</p>
                  
                  <div style={{ marginTop: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600 }}>{insights.ratios.expenseToIncome.toFixed(1)}%</span>
                      <span style={{ fontSize: '12px', color: 'var(--ion-color-medium)' }}>Max 100%</span>
                    </div>
                    <IonProgressBar 
                      value={Math.min(insights.ratios.expenseToIncome / 100, 1)} 
                      color={insights.ratios.expenseToIncome > 90 ? 'danger' : (insights.ratios.expenseToIncome > 70 ? 'warning' : 'success')} 
                      style={{ height: '8px', borderRadius: '4px' }}
                    />
                  </div>
                </div>
              </IonCol>

              {/* Mes a Mes (Variación de Gastos) */}
              <IonCol size="12" className="ion-margin-bottom">
                <div className="glass-card ion-padding">
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Variación vs Mes Anterior</h3>
                  <div style={{ display: 'flex', alignItems: 'center', marginTop: '15px', gap: '15px' }}>
                    <div style={{ 
                      width: '50px', height: '50px', borderRadius: '50%', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: insights.ratios.monthOverMonthExpense > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)'
                    }}>
                      <IonIcon 
                        icon={insights.ratios.monthOverMonthExpense > 0 ? trendingUpOutline : trendingDownOutline} 
                        style={{ fontSize: '28px', color: insights.ratios.monthOverMonthExpense > 0 ? '#ef4444' : '#10b981' }} 
                      />
                    </div>
                    <div>
                      <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: insights.ratios.monthOverMonthExpense > 0 ? '#ef4444' : '#10b981' }}>
                        {insights.ratios.monthOverMonthExpense > 0 ? '+' : ''}{insights.ratios.monthOverMonthExpense.toFixed(1)}%
                      </h2>
                      <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: 'var(--ion-color-medium)' }}>
                        {insights.ratios.monthOverMonthExpense > 0 ? 'Gastaste más que el mes pasado' : 'Ahorraste respecto al mes pasado'}
                      </p>
                    </div>
                  </div>
                </div>
              </IonCol>

              {/* Comparación de Presupuesto */}
              <IonCol size="12" className="ion-margin-bottom">
                <div className="glass-card ion-padding">
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Presupuesto Global</h3>
                  {insights.ratios.budgetUsed > 0 ? (
                    <div style={{ marginTop: '15px' }}>
                      <p style={{ fontSize: '14px', color: 'var(--ion-color-medium)' }}>Porcentaje del presupuesto total consumido</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', marginTop: '10px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 600 }}>{insights.ratios.budgetUsed.toFixed(1)}%</span>
                      </div>
                      <IonProgressBar 
                        value={Math.min(insights.ratios.budgetUsed / 100, 1)} 
                        color={insights.ratios.budgetUsed > 95 ? 'danger' : (insights.ratios.budgetUsed > 75 ? 'warning' : 'primary')} 
                        style={{ height: '8px', borderRadius: '4px' }}
                      />
                    </div>
                  ) : (
                    <p style={{ fontSize: '14px', color: 'var(--ion-color-medium)', marginTop: '10px' }}>No tenés presupuestos configurados para comparar.</p>
                  )}
                </div>
              </IonCol>

              {/* Categorías que más consumen */}
              <IonCol size="12">
                <div className="glass-card ion-padding">
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, marginBottom: '15px' }}>Top Categorías de Gasto</h3>
                  {insights.topCategories.length > 0 ? (
                    insights.topCategories.map((cat: any, i: number) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '12px', borderBottom: i < insights.topCategories.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
                        <span style={{ fontSize: '15px', fontWeight: 500 }}>{cat.name}</span>
                        <span style={{ fontSize: '15px', fontWeight: 700 }}>${cat.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                      </div>
                    ))
                  ) : (
                    <p style={{ fontSize: '14px', color: 'var(--ion-color-medium)' }}>No hay gastos en este periodo.</p>
                  )}
                </div>
              </IonCol>

            </IonRow>
          </IonGrid>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Insights;
