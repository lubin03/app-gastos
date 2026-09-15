import React from 'react';
import { IonIcon, IonSelect, IonSelectOption, IonButton } from '@ionic/react';
import { calendarOutline, chevronBackOutline, chevronForwardOutline } from 'ionicons/icons';
import { useFilter } from '../context/FilterContext';
import { useTranslation } from 'react-i18next';

const DateFilter: React.FC = () => {
  const { startDate, availableYears, setDateRange } = useFilter();
  const { i18n } = useTranslation();

  // Extract year and month directly from YYYY-MM-DD to avoid timezone shifts
  const [yearStr, monthStr] = (startDate || '').split('-');
  const currentYear = parseInt(yearStr, 10) || new Date().getFullYear();
  const currentMonth = (parseInt(monthStr, 10) || (new Date().getMonth() + 1)) - 1; // 0-indexed

  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(2000, i, 1);
    const month = new Intl.DateTimeFormat(i18n.language, { month: 'long' }).format(d);
    return month.charAt(0).toUpperCase() + month.slice(1);
  });

  const handleDateChange = (newMonth: any, newYear: any) => {
    if (newMonth === undefined || newMonth === null || isNaN(Number(newMonth))) return;
    if (newYear === undefined || newYear === null || isNaN(Number(newYear))) return;

    const m = Number(newMonth);
    const y = Number(newYear);

    const pad = (n: number) => String(n).padStart(2, '0');
    const startStr = `${y}-${pad(m + 1)}-01`;
    const lastDay = new Date(y, m + 1, 0).getDate();
    const endStr = `${y}-${pad(m + 1)}-${pad(lastDay)}`;

    setDateRange(startStr, endStr);
  };

  const handlePrevMonth = () => {
    let m = currentMonth - 1;
    let y = currentYear;
    if (m < 0) {
      m = 11;
      y -= 1;
    }
    handleDateChange(m, y);
  };

  const handleNextMonth = () => {
    let m = currentMonth + 1;
    let y = currentYear;
    if (m > 11) {
      m = 0;
      y += 1;
    }
    handleDateChange(m, y);
  };

  return (
    <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 12px', margin: '16px', borderRadius: '30px', zIndex: 10, gap: '4px', border: '1px solid rgba(var(--ion-color-primary-rgb), 0.2)', boxShadow: '0 4px 12px rgba(var(--ion-color-primary-rgb), 0.08)' }}>
      <IonButton fill="clear" size="small" shape="round" onClick={handlePrevMonth} style={{ margin: 0, '--padding-start': '6px', '--padding-end': '6px', height: '32px' }}>
        <IonIcon icon={chevronBackOutline} style={{ color: 'var(--ion-color-primary)', fontSize: '18px' }} />
      </IonButton>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <IonIcon icon={calendarOutline} style={{ color: 'var(--ion-color-primary)', fontSize: '18px' }} />
        
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <IonSelect 
            value={currentMonth} 
            onIonChange={e => {
              if (e.detail.value !== undefined) handleDateChange(e.detail.value, currentYear);
            }}
            interface="popover"
            style={{ minHeight: 'unset', padding: 0, fontWeight: 600 }}
          >
            {months.map((m, i) => (
              <IonSelectOption key={i} value={i}>{m}</IonSelectOption>
            ))}
          </IonSelect>
        </div>

        <div style={{ width: '1px', height: '14px', background: 'rgba(var(--ion-color-primary-rgb), 0.2)' }} />

        <div style={{ display: 'flex', alignItems: 'center' }}>
          <IonSelect 
            value={currentYear} 
            onIonChange={e => {
              if (e.detail.value !== undefined) handleDateChange(currentMonth, e.detail.value);
            }}
            interface="popover"
            style={{ minHeight: 'unset', padding: 0, fontWeight: 600 }}
          >
            {availableYears.map(y => (
              <IonSelectOption key={y} value={y}>{y}</IonSelectOption>
            ))}
          </IonSelect>
        </div>
      </div>

      <IonButton fill="clear" size="small" shape="round" onClick={handleNextMonth} style={{ margin: 0, '--padding-start': '6px', '--padding-end': '6px', height: '32px' }}>
        <IonIcon icon={chevronForwardOutline} style={{ color: 'var(--ion-color-primary)', fontSize: '18px' }} />
      </IonButton>
    </div>
  );
};

export default DateFilter;
