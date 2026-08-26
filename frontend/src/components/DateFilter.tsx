import React from 'react';
import { IonIcon, IonSelect, IonSelectOption } from '@ionic/react';
import { calendarOutline } from 'ionicons/icons';
import { useFilter } from '../context/FilterContext';
import { useTranslation } from 'react-i18next';

const DateFilter: React.FC = () => {
  const { startDate, availableYears, setDateRange } = useFilter();
  const { i18n } = useTranslation();

  const d = new Date(startDate + 'T00:00:00');
  const currentMonth = d.getMonth();
  const currentYear = d.getFullYear();

  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(2000, i, 1);
    const month = new Intl.DateTimeFormat(i18n.language, { month: 'long' }).format(d);
    return month.charAt(0).toUpperCase() + month.slice(1);
  });

  const handleDateChange = (newMonth: number, newYear: number) => {
    const next = new Date(newYear, newMonth, 1);
    const end = new Date(newYear, newMonth + 1, 0);

    setDateRange(
      next.toISOString().split('T')[0],
      end.toISOString().split('T')[0]
    );
  };

  return (
    <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px 16px', margin: '16px', borderRadius: '30px', zIndex: 10, gap: '8px', border: '1px solid rgba(var(--ion-color-primary-rgb), 0.2)', boxShadow: '0 4px 12px rgba(var(--ion-color-primary-rgb), 0.08)' }}>
      <IonIcon icon={calendarOutline} style={{ color: 'var(--ion-color-primary)', fontSize: '20px', marginRight: '4px' }} />
      
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <IonSelect 
          value={currentMonth} 
          onIonChange={e => handleDateChange(e.detail.value, currentYear)}
          interface="popover"
          style={{ minHeight: 'unset', padding: 0, fontWeight: 600 }}
        >
          {months.map((m, i) => (
            <IonSelectOption key={i} value={i}>{m}</IonSelectOption>
          ))}
        </IonSelect>
      </div>

      <div style={{ width: '1px', height: '16px', background: 'rgba(var(--ion-color-primary-rgb), 0.2)' }} />

      <div style={{ display: 'flex', alignItems: 'center' }}>
        <IonSelect 
          value={currentYear} 
          onIonChange={e => handleDateChange(currentMonth, e.detail.value)}
          interface="popover"
          style={{ minHeight: 'unset', padding: 0, fontWeight: 600 }}
        >
          {availableYears.map(y => (
            <IonSelectOption key={y} value={y}>{y}</IonSelectOption>
          ))}
        </IonSelect>
      </div>
    </div>
  );
};

export default DateFilter;
