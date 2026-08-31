import React, { useState, useEffect } from 'react';
import { IonContent, IonPage, IonList, IonItem, IonLabel, IonFab, IonFabButton, IonIcon, IonModal, IonButton, IonInput, IonSpinner, useIonViewWillEnter, IonHeader, IonToolbar, IonTitle, IonProgressBar } from '@ionic/react';
import { add, createOutline, flagOutline } from 'ionicons/icons';
import { goalService, Goal } from '../services/goalService';
import Header from '../components/Header';
import { useTranslation } from 'react-i18next';

const Goals: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  // Create/Edit Modal
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [icon, setIcon] = useState('flagOutline');

  const loadData = async () => {
    try {
      const data = await goalService.getGoals();
      setGoals(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useIonViewWillEnter(() => {
    loadData();
  });

  const openEditModal = (goal: Goal, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingGoal(goal);
    setName(goal.name);
    setTargetAmount(goal.target_amount.toString());
    setCurrentAmount(goal.current_amount.toString());
    setDeadline(goal.deadline ? new Date(goal.deadline).toISOString().split('T')[0] : '');
    setIcon(goal.icon || 'flagOutline');
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingGoal(null);
    setName('');
    setTargetAmount('');
    setCurrentAmount('');
    setDeadline('');
    setIcon('flagOutline');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!name || !targetAmount) return;
    try {
      const payload: Partial<Goal> = {
        name,
        target_amount: parseFloat(targetAmount),
        current_amount: currentAmount ? parseFloat(currentAmount) : 0,
        deadline: deadline || undefined,
        icon
      };

      if (editingGoal) {
        await goalService.updateGoal(editingGoal.id, payload);
      } else {
        await goalService.createGoal(payload);
      }

      setShowModal(false);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!editingGoal) return;
    if (window.confirm('¿Eliminar meta?')) {
      try {
        await goalService.deleteGoal(editingGoal.id);
        setShowModal(false);
        loadData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <IonPage>
      <Header title="Metas Financieras" />
      <IonContent className="ion-padding-horizontal">
        {loading ? <IonSpinner className="ion-margin ion-text-center" color="primary" /> : (
          <IonList style={{ background: 'transparent', paddingBottom: '80px' }}>
            {goals.length === 0 && (
              <IonItem lines="none">
                <IonLabel className="ion-text-center" color="medium">No tienes metas aún.</IonLabel>
              </IonItem>
            )}
            {goals.map(goal => {
              const progress = goal.target_amount > 0 ? Math.min(goal.current_amount / goal.target_amount, 1) : 0;
              return (
                <IonItem key={goal.id} className="glass-item" lines="none" style={{ marginBottom: '16px', borderRadius: '16px', '--padding-start': '16px' }}>
                  <IonIcon icon={flagOutline} slot="start" color="primary" />
                  <IonLabel style={{ padding: '8px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h2 style={{ fontWeight: 600, fontSize: '16px', color: '#fff', margin: 0 }}>{goal.name}</h2>
                      <IonButton fill="clear" onClick={(e) => openEditModal(goal, e)} color="primary" size="small" style={{ margin: 0 }}>
                        <IonIcon icon={createOutline} />
                      </IonButton>
                    </div>
                    <p style={{ fontSize: '14px', color: '#94a3b8', marginTop: '4px', marginBottom: '8px' }}>
                      ${goal.current_amount.toFixed(2)} / ${goal.target_amount.toFixed(2)}
                      {goal.deadline && <span style={{ marginLeft: '8px' }}>| Límite: {new Date(goal.deadline).toLocaleDateString()}</span>}
                    </p>
                    <IonProgressBar value={progress} color={progress >= 1 ? "success" : "primary"} style={{ height: '8px', borderRadius: '4px' }} />
                  </IonLabel>
                </IonItem>
              );
            })}
          </IonList>
        )}

        <IonFab vertical="bottom" horizontal="end" slot="fixed" style={{ marginBottom: '16px', marginRight: '8px' }}>
          <IonFabButton onClick={openCreateModal} style={{ '--background': 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)' }}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>

        <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)} className="glass-modal">
          <IonHeader>
            <IonToolbar>
              <IonTitle>{editingGoal ? 'Editar Meta' : 'Nueva Meta'}</IonTitle>
              <IonButton slot="end" fill="clear" onClick={() => setShowModal(false)}>{t('common.cancel')}</IonButton>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <IonItem className="glass-input" lines="none">
              <IonInput value={name} onIonInput={e => setName(e.detail.value!)} label="Nombre de la Meta" labelPlacement="floating" />
            </IonItem>
            
            <IonItem className="glass-input" lines="none">
              <IonInput type="number" value={targetAmount} onIonInput={e => setTargetAmount(e.detail.value!)} label="Monto Objetivo" labelPlacement="floating" />
            </IonItem>

            <IonItem className="glass-input" lines="none">
              <IonInput type="number" value={currentAmount} onIonInput={e => setCurrentAmount(e.detail.value!)} label="Monto Ahorrado" labelPlacement="floating" />
            </IonItem>

            <IonItem className="glass-input" lines="none">
              <IonInput type="date" value={deadline} onIonInput={e => setDeadline(e.detail.value!)} label="Fecha Límite" labelPlacement="floating" />
            </IonItem>

            <IonButton expand="block" shape="round" className="ion-margin-top" style={{ height: '50px', '--background': 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)', fontWeight: 600, fontSize: '16px' }} onClick={handleSave}>
              {t('common.save')}
            </IonButton>

            {editingGoal && (
              <IonButton expand="block" color="danger" fill="clear" className="ion-margin-top" onClick={handleDelete}>
                Eliminar Meta
              </IonButton>
            )}
          </IonContent>
        </IonModal>

      </IonContent>
    </IonPage>
  );
};

export default Goals;
