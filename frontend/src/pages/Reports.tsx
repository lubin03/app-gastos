import React, { useState, useEffect } from 'react';
import { IonContent, IonPage, IonGrid, IonRow, IonCol, IonSpinner, IonIcon, useIonViewWillEnter, IonSegment, IonSegmentButton, IonLabel } from '@ionic/react';
import { barChartOutline, trendingUpOutline } from 'ionicons/icons';
import { useTranslation } from 'react-i18next';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import Header from '../components/Header';
import DateFilter from '../components/DateFilter';
import { useFilter } from '../context/FilterContext';
import { api } from '../services/api';

const Reports: React.FC = () => {
  const { t } = useTranslation();
  const { startDate, endDate } = useFilter();
  const [loading, setLoading] = useState(true);
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');

  useIonViewWillEnter(() => {
    fetchReportsData();
  });

  useEffect(() => {
    if (viewMode === 'daily') {
      fetchDailyData();
    }
  }, [startDate, endDate]);

  const fetchReportsData = async () => {
    setLoading(true);
    await Promise.all([fetchDailyData(), fetchMonthlyData()]);
    setLoading(false);
  };

  const fetchDailyData = async () => {
    try {
      const data = await api.get(`/reports/daily?startDate=${startDate}&endDate=${endDate}`);
      // Format dates for display (e.g. '01', '02', '03')
      const formatted = data.map((d: any) => {
        const day = d.date.split('-')[2];
        return {
          ...d,
          displayDate: day,
          balance: d.income - d.expense
        };
      });
      setDailyData(formatted);
    } catch (err) {
      console.error('Failed to load daily reports', err);
    }
  };

  const fetchMonthlyData = async () => {
    try {
      const data = await api.get('/reports/monthly');
      const formatted = data.map((d: any) => {
        const [year, month] = d.month.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        const monthName = date.toLocaleString('default', { month: 'short' });
        return {
          ...d,
          displayMonth: `${monthName} ${year.substring(2)}`,
          balance: d.income - d.expense
        };
      });
      setMonthlyData(formatted);
    } catch (err) {
      console.error('Failed to load monthly reports', err);
    }
  };

  return (
    <IonPage>
      <Header title={t('reports.title', 'Informes')} />
      {viewMode === 'daily' && <DateFilter />}
      
      <IonContent className="ion-padding">
        <div style={{ marginBottom: '20px' }}>
          <IonSegment value={viewMode} onIonChange={e => setViewMode(e.detail.value as any)} mode="ios">
            <IonSegmentButton value="daily">
              <IonLabel>{t('reports.daily', 'Diario')}</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="monthly">
              <IonLabel>{t('reports.monthly', 'Histórico Mensual')}</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </div>

        {loading ? (
          <div className="ion-text-center ion-margin-top"><IonSpinner name="crescent" color="primary" /></div>
        ) : (
          <IonGrid className="ion-no-padding">
            {viewMode === 'daily' ? (
              <IonRow>
                <IonCol size="12">
                  <div className="glass-card ion-padding">
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px', gap: '8px' }}>
                      <IonIcon icon={trendingUpOutline} style={{ color: 'var(--ion-color-primary)', fontSize: '20px' }} />
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Evolución Diaria</h3>
                    </div>
                    
                    {dailyData.length > 0 ? (
                      <div style={{ height: '300px', marginTop: '20px' }}>
                        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                          <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                            <XAxis dataKey="displayDate" axisLine={false} tickLine={false} style={{ fontSize: '12px' }} />
                            <YAxis axisLine={false} tickLine={false} style={{ fontSize: '12px' }} tickFormatter={(val) => `$${val}`} />
                            <Tooltip 
                              formatter={(value: number) => `$${value.toLocaleString()}`}
                              labelFormatter={(label) => `Día ${label}`}
                            />
                            <Legend />
                            <Area type="monotone" dataKey="income" name="Ingresos" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" />
                            <Area type="monotone" dataKey="expense" name="Gastos" stroke="#f43f5e" fillOpacity={1} fill="url(#colorExpense)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="ion-text-center ion-padding" style={{ color: 'var(--ion-color-medium)' }}>
                        <p>No hay datos para este mes.</p>
                      </div>
                    )}
                  </div>
                </IonCol>

                {/* Tabla detalle diario */}
                <IonCol size="12" className="ion-margin-top">
                  <h3 style={{ margin: '15px 0', fontSize: '18px', fontWeight: 600 }}>Detalle por Día</h3>
                  {dailyData.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {dailyData.map((d, i) => (
                        <div key={i} className="glass-card ion-padding" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--ion-color-primary)' }}>{d.displayDate}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '20px', textAlign: 'right' }}>
                            <div>
                              <p style={{ margin: 0, fontSize: '11px', color: 'var(--ion-color-medium)' }}>Gastos</p>
                              <p style={{ margin: 0, fontWeight: 600, color: '#f43f5e' }}>${d.expense.toLocaleString()}</p>
                            </div>
                            <div>
                              <p style={{ margin: 0, fontSize: '11px', color: 'var(--ion-color-medium)' }}>Ingresos</p>
                              <p style={{ margin: 0, fontWeight: 600, color: '#10b981' }}>${d.income.toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: 'var(--ion-color-medium)', textAlign: 'center' }}>Sin movimientos.</p>
                  )}
                </IonCol>
              </IonRow>
            ) : (
              <IonRow>
                <IonCol size="12">
                  <div className="glass-card ion-padding">
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px', gap: '8px' }}>
                      <IonIcon icon={barChartOutline} style={{ color: 'var(--ion-color-primary)', fontSize: '20px' }} />
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Balance Histórico (12 meses)</h3>
                    </div>
                    
                    {monthlyData.length > 0 ? (
                      <div style={{ height: '350px', marginTop: '20px' }}>
                        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                          <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                            <XAxis dataKey="displayMonth" axisLine={false} tickLine={false} style={{ fontSize: '11px' }} />
                            <YAxis axisLine={false} tickLine={false} style={{ fontSize: '11px' }} tickFormatter={(val) => `$${val}`} />
                            <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                            <Legend />
                            <Bar dataKey="income" name="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="expense" name="Gastos" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="ion-text-center ion-padding" style={{ color: 'var(--ion-color-medium)' }}>
                        <p>No hay datos históricos.</p>
                      </div>
                    )}
                  </div>
                </IonCol>
              </IonRow>
            )}
          </IonGrid>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Reports;
