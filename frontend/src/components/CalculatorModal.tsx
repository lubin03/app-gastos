import React, { useState, useEffect } from 'react';
import { IonModal, IonContent, IonButton, IonIcon, IonHeader, IonToolbar, IonTitle } from '@ionic/react';
import { backspaceOutline, checkmarkOutline } from 'ionicons/icons';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (value: number) => void;
  initialValue?: number | string;
}

const CalculatorModal: React.FC<Props> = ({ isOpen, onClose, onConfirm, initialValue }) => {
  const [expression, setExpression] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialValue) {
        setExpression(initialValue.toString());
      } else {
        setExpression('');
      }
    }
  }, [isOpen, initialValue]);

  const handlePress = (val: string) => {
    setExpression(prev => prev + val);
  };

  const handleBackspace = () => {
    setExpression(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setExpression('');
  };

  const evaluateExpression = (expr: string): number => {
    try {
      const cleanExpr = expr.replace(/[^-()\d/*+.]/g, '');
      if (!cleanExpr) return 0;
      // eslint-disable-next-line no-new-func
      const result = new Function(`return ${cleanExpr}`)();
      return isNaN(result) || !isFinite(result) ? 0 : Number(result);
    } catch (e) {
      return 0;
    }
  };

  const handleConfirm = () => {
    const finalValue = evaluateExpression(expression);
    onConfirm(finalValue);
  };

  const renderButton = (label: string | React.ReactNode, onClick: () => void, type: 'number' | 'operator' | 'action', style?: React.CSSProperties) => {
    let color = 'var(--ion-text-color, #fff)';
    let className = 'calc-btn';
    
    if (type === 'operator') {
      className += ' calc-btn-operator';
      color = 'var(--ion-color-primary, #8b5cf6)';
    } else if (type === 'action') {
      className += ' calc-btn-action';
      color = 'var(--ion-color-danger, #f43f5e)';
    }

    return (
      <IonButton
        fill="clear"
        expand="block"
        onClick={onClick}
        className={className}
        style={{ 
          margin: 0,
          height: '100%', 
          fontSize: '24px', 
          '--border-radius': '16px',
          '--color': color,
          fontWeight: type === 'number' ? 400 : 600,
          ...style
        }}
      >
        {label}
      </IonButton>
    );
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose} className="glass-modal">
      <IonHeader>
        <IonToolbar>
          <IonTitle>Calculadora</IonTitle>
          <IonButton slot="end" fill="clear" onClick={onClose}>Cancelar</IonButton>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding" style={{ '--background': 'var(--ion-background-color)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          
          <div className="calc-display" style={{ 
            borderRadius: '16px', 
            padding: '20px', 
            marginBottom: '20px',
            marginTop: '10px',
            textAlign: 'right',
            minHeight: '80px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end'
          }}>
            <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--ion-text-color, #fff)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {expression || '0'}
            </div>
            <div style={{ fontSize: '14px', color: 'var(--ion-color-success, #10b981)', height: '20px', marginTop: '4px' }}>
              {expression && /[+*/-]/.test(expression) ? `= ${evaluateExpression(expression).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}` : ''}
            </div>
          </div>

          <div style={{ 
            flex: 1, 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4, 1fr)', 
            gridTemplateRows: 'repeat(5, 1fr)', 
            gap: '8px',
            minHeight: '300px'
          }}>
            {/* Row 1 */}
            {renderButton('C', handleClear, 'action')}
            {renderButton('/', () => handlePress('/'), 'operator')}
            {renderButton('*', () => handlePress('*'), 'operator')}
            {renderButton(<IonIcon icon={backspaceOutline} />, handleBackspace, 'action')}
            
            {/* Row 2 */}
            {renderButton('7', () => handlePress('7'), 'number')}
            {renderButton('8', () => handlePress('8'), 'number')}
            {renderButton('9', () => handlePress('9'), 'number')}
            {renderButton('-', () => handlePress('-'), 'operator')}
            
            {/* Row 3 */}
            {renderButton('4', () => handlePress('4'), 'number')}
            {renderButton('5', () => handlePress('5'), 'number')}
            {renderButton('6', () => handlePress('6'), 'number')}
            {renderButton('+', () => handlePress('+'), 'operator')}
            
            {/* Row 4 */}
            {renderButton('1', () => handlePress('1'), 'number')}
            {renderButton('2', () => handlePress('2'), 'number')}
            {renderButton('3', () => handlePress('3'), 'number')}
            <IonButton
              fill="clear"
              expand="block"
              onClick={handleConfirm}
              style={{ 
                margin: 0,
                height: '100%',
                fontSize: '24px', 
                '--border-radius': '16px', 
                '--background': 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                '--color': '#fff',
                gridRow: 'span 2'
              }}
            >
              <IonIcon icon={checkmarkOutline} />
            </IonButton>
            
            {/* Row 5 */}
            {renderButton('0', () => handlePress('0'), 'number', { gridColumn: 'span 2' })}
            {renderButton('.', () => handlePress('.'), 'number')}
          </div>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default CalculatorModal;
