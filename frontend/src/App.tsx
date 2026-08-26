import React from 'react';
import { Redirect, Route } from 'react-router-dom';
import {
  IonApp,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  setupIonicReact
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { home, list, card, pieChart, pricetags, analyticsOutline, barChartOutline } from 'ionicons/icons';

import { AuthProvider, useAuth } from './context/AuthContext';
import { FilterProvider } from './context/FilterContext';
import { useTranslation } from 'react-i18next';

import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Accounts from './pages/Accounts';
import Budgets from './pages/Budgets';
import Categories from './pages/Categories';
import Profile from './pages/Profile';
import Insights from './pages/Insights';
import Reports from './pages/Reports';
import CreditCards from './pages/CreditCards';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme variables */
import './theme/variables.css';

setupIonicReact();

const PrivateRoutes: React.FC = () => {
  const { user, loading } = useAuth();
  const { t } = useTranslation();

  if (loading) return null;

  if (!user) {
    return <Redirect to="/login" />;
  }

  return (
    <IonTabs>
      <IonRouterOutlet>
        <Route exact path="/app/dashboard"><Dashboard /></Route>
        <Route exact path="/app/transactions"><Transactions /></Route>
        <Route exact path="/app/accounts"><Accounts /></Route>
        <Route exact path="/app/budgets"><Budgets /></Route>
        <Route exact path="/app/categories"><Categories /></Route>
        <Route exact path="/app/profile"><Profile /></Route>
        <Route exact path="/app/insights"><Insights /></Route>
        <Route exact path="/app/reports"><Reports /></Route>
        <Route exact path="/app/credit-cards"><CreditCards /></Route>
        <Route exact path="/app"><Redirect to="/app/dashboard" /></Route>
      </IonRouterOutlet>
      <IonTabBar slot="bottom" className="custom-tab-bar">
        <IonTabButton tab="dashboard" href="/app/dashboard">
          <IonIcon icon={home} />
          <IonLabel>{t('dashboard.title')}</IonLabel>
        </IonTabButton>
        <IonTabButton tab="transactions" href="/app/transactions">
          <IonIcon icon={list} />
          <IonLabel>{t('transactions.title')}</IonLabel>
        </IonTabButton>
        <IonTabButton tab="accounts" href="/app/accounts">
          <IonIcon icon={card} />
          <IonLabel>{t('accounts.title')}</IonLabel>
        </IonTabButton>
        <IonTabButton tab="budgets" href="/app/budgets">
          <IonIcon icon={pieChart} />
          <IonLabel>{t('budgets.title')}</IonLabel>
        </IonTabButton>
        <IonTabButton tab="insights" href="/app/insights">
          <IonIcon icon={analyticsOutline} />
          <IonLabel>Actuación</IonLabel>
        </IonTabButton>
        <IonTabButton tab="credit-cards" href="/app/credit-cards">
          <IonIcon icon={card} />
          <IonLabel>Tarjetas</IonLabel>
        </IonTabButton>
        <IonTabButton tab="reports" href="/app/reports">
          <IonIcon icon={barChartOutline} />
          <IonLabel>Informes</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  );
};

const AppRoutes: React.FC = () => {
  return (
    <IonReactRouter>
      <IonRouterOutlet>
        <Route exact path="/login" component={Login} />
        <Route exact path="/register" component={Register} />
        <Route exact path="/forgot-password" component={ForgotPassword} />
        <Route exact path="/reset-password" component={ResetPassword} />
        <Route path="/app">
          <PrivateRoutes />
        </Route>
        <Route exact path="/">
          <Redirect to="/app/dashboard" />
        </Route>
      </IonRouterOutlet>
    </IonReactRouter>
  );
};

const App: React.FC = () => (
  <IonApp>
    <AuthProvider>
      <FilterProvider>
        <AppRoutes />
      </FilterProvider>
    </AuthProvider>
  </IonApp>
);

export default App;
