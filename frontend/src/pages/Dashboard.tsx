import React, { useState } from 'react';
import { IonContent, IonPage, IonGrid, IonRow, IonCol, IonSpinner, IonIcon, useIonViewWillEnter, IonText, IonButton } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { walletOutline, trendingUpOutline, trendingDownOutline, cardOutline } from 'ionicons/icons';
import { useAuth } from '../context/AuthContext';
import { useFilter } from '../context/FilterContext';
import { api } from '../services/api';
import Header from '../components/Header';
import DateFilter from '../components/DateFilter';
import { useTranslation } from 'react-i18next';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, Label } from 'recharts';

const generateColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 75%, 55%)`; // Vibrant colors
};

const CustomLegend = (props: any) => {
  const { payload } = props;
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: '15px 0 0 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {payload.map((entry: any, index: number) => (
        <li key={`item-${index}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: generateColor(entry.value), display: 'inline-block' }}></span>
            <span style={{ fontSize: '14px', color: 'var(--ion-text-color)' }}>{entry.value}</span>
          </div>
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ion-text-color)' }}>
            ${entry.payload.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </li>
      ))}
    </ul>
  );
};

const Dashboard: React.FC = () => {
  const history = useHistory();
  const { user } = useAuth();
  const { startDate, endDate } = useFilter();
  const [loading, setLoading] = useState(true);
  const [dashboardAccounts, setDashboardAccounts] = useState<any[]>([]);
  const [balance, setBalance] = useState({ 
    bankTotal: 0, 
    ccDebt: 0, 
    income: 0, 
    expense: 0,
    expensesByCategory: [] as any[],
    incomeByCategory: [] as any[],
    monthlyBalance: [] as any[]
  });
  const { t } = useTranslation();

  const [creditCards, setCreditCards] = useState<any[]>([]);

  useIonViewWillEnter(() => {
    fetchDashboardData();
    fetchCreditCards();
  });

  // Re-fetch when dates change
  React.useEffect(() => {
    fetchDashboardData();
  }, [startDate, endDate]);

  const fetchCreditCards = async () => {
    try {
      const data = await api.get('/credit-cards');
      setCreditCards(data.slice(0, 3)); // Only top 3
    } catch (err) {
      console.error('Failed to load credit cards for dashboard', err);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [data, accData] = await Promise.all([
        api.get(`/dashboard?startDate=${startDate}&endDate=${endDate}`),
        api.get(`/accounts?endDate=${endDate}`)
      ]);
      setDashboardAccounts(accData || []);
      setBalance({ 
        bankTotal: data.bankTotal || 0, 
        ccDebt: data.ccDebt || 0, 
        income: data.income || 0, 
        expense: data.expense || 0,
        expensesByCategory: data.expensesByCategory || [],
        incomeByCategory: data.incomeByCategory || [],
        monthlyBalance: data.monthlyBalance || []
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

            {/* Accounts Balances Section for Selected Period */}
            {dashboardAccounts.filter(a => a.type !== 'credit_card' && !a.is_archived).length > 0 && (
              <IonRow className="ion-margin-top">
                <IonCol size="12">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Saldos de Cuentas</h3>
                    <IonButton routerLink="/app/accounts" fill="clear" size="small" style={{ margin: 0 }}>
                      Ver todas
                    </IonButton>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
                    {dashboardAccounts.filter(a => a.type !== 'credit_card' && !a.is_archived).slice(0, 6).map(acc => {
                      const bal = Number(acc.balance || 0);
                      const isNeg = bal < 0;
                      return (
                        <div 
                          key={acc.id} 
                          className="glass-card ion-padding" 
                          style={{ borderRadius: '12px', cursor: 'pointer' }}
                          onClick={() => history.push(`/app/transactions?accountId=${acc.id}`)}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                            <IonIcon icon={walletOutline} style={{ color: 'var(--ion-color-primary)', fontSize: '16px' }} />
                            <span style={{ fontWeight: 600, fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {acc.name}
                            </span>
                          </div>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: isNeg ? 'var(--ion-color-danger, #ef4444)' : 'var(--ion-color-success, #10b981)' }}>
                            {isNeg ? '-' : ''}${Math.abs(bal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </IonCol>
              </IonRow>
            )}

            {/* Credit Cards Section */}
            {creditCards.length > 0 && (
              <IonRow className="ion-margin-top">
                <IonCol size="12">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Tarjetas de Crédito</h3>
                    <IonButton routerLink="/app/credit-cards" fill="clear" size="small" style={{ margin: 0 }}>
                      Ver más
                    </IonButton>
                  </div>
                  {creditCards.map(card => {
                    const progress = card.limit > 0 ? card.consumed / card.limit : 0;
                    return (
                      <div key={card.id} className="glass-card ion-padding ion-margin-bottom" style={{ borderRadius: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontWeight: 600 }}>{card.name}</span>
                          <span style={{ fontWeight: 700, color: 'var(--ion-color-danger)' }}>${card.consumed.toLocaleString()}</span>
                        </div>
                        <div style={{ width: '100%', height: '6px', background: 'rgba(0,0,0,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${progress * 100}%`, height: '100%', background: 'var(--ion-color-primary)', borderRadius: '3px' }}></div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--ion-color-medium)', marginTop: '8px' }}>
                          <span>Límite: ${card.limit.toLocaleString()}</span>
                          <span>Disponible: ${(card.available).toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })}
                </IonCol>
              </IonRow>
            )}

            {/* Charts Row */}
            <IonRow className="ion-margin-top">
              <IonCol size="12" sizeMd="6">
                <div className="glass-card ion-padding">
                  <h3 style={{ marginTop: 0, fontSize: '16px', fontWeight: 600 }}>{t('dashboard.expensesByCategory', 'Gastos por Categoría')}</h3>
                  {balance.expensesByCategory.length > 0 ? (
                    <div>
                      <div style={{ height: '220px' }}>
                        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                          <PieChart>
                            <Pie
                              data={balance.expensesByCategory}
                              cx="50%"
                              cy="50%"
                              innerRadius={65}
                              outerRadius={90}
                              fill="#8884d8"
                              paddingAngle={0}
                              dataKey="value"
                              stroke="none"
                            >
                              {balance.expensesByCategory.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={generateColor(entry.name)} />
                              ))}
                              <Label 
                                value={`$${(balance.expense / 1000).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 1 })}k`} 
                                position="center" 
                                fill="var(--ion-text-color)" 
                                style={{ fontSize: '14px', fontWeight: 'bold' }} 
                              />
                            </Pie>
                            <Tooltip formatter={(value: any) => `$${Number(value).toLocaleString()}`} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <CustomLegend payload={balance.expensesByCategory.map((entry) => ({
                        value: entry.name,
                        payload: { value: entry.value }
                      }))} />
                    </div>
                  ) : (
                    <div className="ion-text-center ion-padding" style={{ color: 'var(--ion-color-medium)' }}>
                      <p>{t('dashboard.noExpenses', 'No hay gastos registrados este mes.')}</p>
                    </div>
                  )}
                </div>
              </IonCol>

              <IonCol size="12" sizeMd="6">
                <div className="glass-card ion-padding">
                  <h3 style={{ marginTop: 0, fontSize: '16px', fontWeight: 600 }}>{t('dashboard.incomeByCategory', 'Ingresos por Categoría')}</h3>
                  {balance.incomeByCategory.length > 0 ? (
                    <div>
                      <div style={{ height: '220px' }}>
                        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                          <PieChart>
                            <Pie
                              data={balance.incomeByCategory}
                              cx="50%"
                              cy="50%"
                              innerRadius={65}
                              outerRadius={90}
                              fill="#82ca9d"
                              paddingAngle={0}
                              dataKey="value"
                              stroke="none"
                            >
                              {balance.incomeByCategory.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={generateColor(entry.name)} />
                              ))}
                              <Label 
                                value={`$${(balance.income / 1000).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 1 })}k`} 
                                position="center" 
                                fill="var(--ion-text-color)" 
                                style={{ fontSize: '14px', fontWeight: 'bold' }} 
                              />
                            </Pie>
                            <Tooltip formatter={(value: any) => `$${Number(value).toLocaleString()}`} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <CustomLegend payload={balance.incomeByCategory.map((entry) => ({
                        value: entry.name,
                        payload: { value: entry.value }
                      }))} />
                    </div>
                  ) : (
                    <div className="ion-text-center ion-padding" style={{ color: 'var(--ion-color-medium)' }}>
                      <p>{t('dashboard.noIncome', 'No hay ingresos este mes.')}</p>
                    </div>
                  )}
                </div>
              </IonCol>

              <IonCol size="12">
                <div className="glass-card ion-padding ion-margin-top">
                  <h3 style={{ marginTop: 0, fontSize: '16px', fontWeight: 600 }}>{t('dashboard.monthlyBalance', 'Balance Mensual')}</h3>
                  {balance.monthlyBalance.length > 0 ? (
                    <div style={{ height: '300px' }}>
                      <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                        <BarChart data={balance.monthlyBalance}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} stroke="var(--ion-color-medium)" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} stroke="var(--ion-color-medium)" tick={{ fill: 'var(--ion-color-medium)' }} />
                          <YAxis axisLine={false} tickLine={false} stroke="var(--ion-color-medium)" tick={{ fill: 'var(--ion-color-medium)' }} tickFormatter={(value) => `$${value}`} />
                          <Tooltip formatter={(value: any) => `$${Number(value).toLocaleString()}`} />
                          <Legend wrapperStyle={{ color: 'var(--ion-text-color)' }} />
                          <Bar dataKey="income" name="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="expense" name="Gastos" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="ion-text-center ion-padding" style={{ color: 'var(--ion-color-medium)' }}>
                      <p>{t('dashboard.noTransactions', 'No hay transacciones registradas.')}</p>
                    </div>
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

export default Dashboard;
