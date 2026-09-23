import React, { useState } from 'react';
import { IonItem, IonLabel } from '@ionic/react';
import CalculatorModal from './CalculatorModal';

interface Props {
  value: string | number;
  onChange: (val: string) => void;
  label?: string;
  className?: string;
}

const AmountInput: React.FC<Props> = ({ value, onChange, label = 'Monto', className = 'glass-input' }) => {
  const [showCalculator, setShowCalculator] = useState(false);

  const numericValue = Number(value);
  const displayValue = !isNaN(numericValue) && numericValue !== 0 
    ? numericValue.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0, maximumFractionDigits: 2 }) 
    : '$ 0';

  return (
    <>
      <IonItem className={className} lines="none" button onClick={() => setShowCalculator(true)} detail={false}>
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', paddingTop: '8px', paddingBottom: '8px' }}>
          <IonLabel style={{ fontSize: '12px', color: '#94a3b8', transform: 'none', marginBottom: '4px', marginTop: 0 }}>{label}</IonLabel>
          <div style={{ fontSize: '16px', color: 'var(--ion-text-color, inherit)', fontWeight: 600, minHeight: '24px', display: 'flex', alignItems: 'center' }}>
            {displayValue}
          </div>
        </div>
      </IonItem>

      <CalculatorModal
        isOpen={showCalculator}
        onClose={() => setShowCalculator(false)}
        initialValue={value}
        onConfirm={(newVal) => {
          onChange(newVal.toString());
          setShowCalculator(false);
        }}
      />
    </>
  );
};

export default AmountInput;
