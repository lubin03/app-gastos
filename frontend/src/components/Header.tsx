import React, { useState, useEffect } from 'react';
import { IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon } from '@ionic/react';
import { logOutOutline, moonOutline, sunnyOutline, personOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface Props {
  title: string;
}

const Header: React.FC<Props> = ({ title }) => {
  const { logout } = useAuth();
  const history = useHistory();
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // Check initial state
    setIsDark(!document.body.classList.contains('light-theme'));

    // Listen for changes from other tabs/pages
    const observer = new MutationObserver(() => {
      setIsDark(!document.body.classList.contains('light-theme'));
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const toggleTheme = () => {
    const willBeDark = !isDark;
    setIsDark(willBeDark);
    if (willBeDark) {
      document.body.classList.remove('light-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.add('light-theme');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <IonHeader>
      <IonToolbar>
        <IonTitle>{title}</IonTitle>
        <IonButtons slot="end">
          <IonButton onClick={() => history.push('/app/profile')} className="header-icon-btn">
            <IonIcon icon={personOutline} />
          </IonButton>
          <IonButton onClick={toggleTheme} className="header-icon-btn">
            <IonIcon icon={isDark ? sunnyOutline : moonOutline} />
          </IonButton>
          <IonButton onClick={logout} className="header-icon-btn">
            <IonIcon icon={logOutOutline} />
          </IonButton>
        </IonButtons>
      </IonToolbar>
    </IonHeader>
  );
};

export default Header;
