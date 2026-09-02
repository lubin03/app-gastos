import React, { useState, useEffect } from 'react';
import { IonModal, IonHeader, IonToolbar, IonTitle, IonButton, IonContent, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption } from '@ionic/react';
import { api } from '../services/api';
import { tagService, Tag } from '../services/tagService';
import { attachmentService, Attachment } from '../services/attachmentService';
import { useTranslation } from 'react-i18next';
import { documentOutline, trashOutline, attachOutline } from 'ionicons/icons';
import { IonIcon } from '@ionic/react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  transaction?: any;
}

const formatDateToLocalInput = (dateInput?: string | Date) => {
  if (!dateInput) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    return dateInput;
  }
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getIsoDateFromInput = (inputDate: string, originalDate?: string) => {
  if (!inputDate) return originalDate || new Date().toISOString();
  if (originalDate && inputDate === formatDateToLocalInput(originalDate)) {
    return originalDate;
  }
  const parts = inputDate.split('-').map(Number);
  if (parts.length === 3 && !parts.some(isNaN)) {
    const [y, m, d] = parts;
    const now = new Date();
    return new Date(y, m - 1, d, now.getHours(), now.getMinutes(), now.getSeconds()).toISOString();
  }
  return new Date().toISOString();
};

const TransactionModal: React.FC<Props> = ({ isOpen, onClose, onSaved, transaction }) => {
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(formatDateToLocalInput());
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [accountId, setAccountId] = useState('');
  const [destinationAccountId, setDestinationAccountId] = useState('');
  const [installments, setInstallments] = useState('1');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [frequentTransactions, setFrequentTransactions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<any[]>([]);
  const { t } = useTranslation();

  useEffect(() => {
    if (isOpen) {
      api.get('/accounts').then(setAccounts).catch(console.error);
      api.get('/categories').then(setCategories).catch(console.error);
      tagService.getTags().then(setAvailableTags).catch(console.error);
      api.get('/transactions/frequent').then(res => setFrequentTransactions(res)).catch(console.error);

      if (transaction) {
        setType(transaction.type);
        setAmount(transaction.amount);
        setDate(formatDateToLocalInput(transaction.date));
        setCategoryId(transaction.category_id);
        setDescription(transaction.description);
        setAccountId(transaction.account_id);
        setDestinationAccountId(transaction.destination_account_id || '');
        setSelectedTags(transaction.tags?.map((t: any) => t.id) || []);
        attachmentService.getAttachmentsByTransaction(transaction.id).then(setAttachments).catch(console.error);
        setPendingFile(null);
      } else {
        setType('expense');
        setAmount('');
        setDate(formatDateToLocalInput());
        setCategoryId('');
        setDescription('');
        setAccountId('');
        setDestinationAccountId('');
        setInstallments('1');
        setSelectedTags([]);
        setAttachments([]);
        setPendingFile(null);
      }
    }
  }, [isOpen, transaction]);

  const selectedAccount = accounts.find(a => a.id === accountId);
  const isCreditCard = selectedAccount?.type === 'credit_card';

  const handleSave = async () => {
    try {
      const payload = {
        type,
        amount: parseFloat(amount),
        category_id: categoryId,
        description,
        accountId,
        destination_account_id: type === 'transfer' ? destinationAccountId : null,
        date: getIsoDateFromInput(date, transaction?.date),
        tags: selectedTags,
        installments: isCreditCard && !transaction ? parseInt(installments, 10) || 1 : 1
      };

      if (transaction) {
        await api.put(`/transactions/${transaction.id}`, payload);
        if (pendingFile) {
          await attachmentService.uploadAttachment(transaction.id, pendingFile);
        }
      } else {
        const res = await api.post('/transactions', payload);
        if (pendingFile && res.data.id) {
          await attachmentService.uploadAttachment(res.data.id, pendingFile);
        }
      }
      onSaved();
    } catch (err) {
      console.error(err);
    }
  };

  const selectableAccounts = accounts.filter(acc => !acc.is_archived || acc.id === accountId || acc.id === destinationAccountId);

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose} className="glass-modal">
      <IonHeader>
        <IonToolbar>
          <IonTitle>{transaction ? t('transactions.edit') : t('transactions.new')}</IonTitle>
          <IonButton slot="end" fill="clear" onClick={onClose}>{t('common.cancel')}</IonButton>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonItem className="glass-input" lines="none">
          <IonSelect value={type} onIonChange={e => setType(e.detail.value)} label={t('common.type')} labelPlacement="floating">
            <IonSelectOption value="expense">{t('transactions.expense')}</IonSelectOption>
            <IonSelectOption value="income">{t('transactions.income')}</IonSelectOption>
            <IonSelectOption value="transfer">{t('transactions.transfer')}</IonSelectOption>
          </IonSelect>
        </IonItem>
        <IonItem className="glass-input" lines="none">
          <IonSelect value={accountId} onIonChange={e => setAccountId(e.detail.value)} label={type === 'transfer' ? t('transactions.originAccount', 'Cuenta Origen') : t('transactions.account')} labelPlacement="floating">
            {selectableAccounts.map(acc => (
              <IonSelectOption key={acc.id} value={acc.id}>{acc.name} {acc.is_archived ? '(Archivada)' : ''}</IonSelectOption>
            ))}
          </IonSelect>
        </IonItem>
        {type === 'transfer' && (
          <IonItem className="glass-input" lines="none">
            <IonSelect value={destinationAccountId} onIonChange={e => setDestinationAccountId(e.detail.value)} label={t('transactions.destinationAccount', 'Cuenta Destino')} labelPlacement="floating">
              {selectableAccounts.map(acc => (
                <IonSelectOption key={acc.id} value={acc.id}>{acc.name} {acc.is_archived ? '(Archivada)' : ''}</IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>
        )}
        {isCreditCard && !transaction && type === 'expense' && (
          <IonItem className="glass-input" lines="none">
            <IonSelect value={installments} onIonChange={e => setInstallments(e.detail.value)} label="Cuotas (Meses)" labelPlacement="floating">
              {Array.from({length: 48}, (_, i) => i + 1).map(num => (
                <IonSelectOption key={num} value={num.toString()}>{num} {num === 1 ? 'mes' : 'meses'}</IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>
        )}
        <IonItem className="glass-input" lines="none">
          <IonInput type="number" value={amount} onIonInput={e => setAmount(e.detail.value!)} label={t('common.amount')} labelPlacement="floating" />
        </IonItem>
        <IonItem className="glass-input" lines="none">
          <IonInput 
            type="date" 
            value={date} 
            onIonInput={e => setDate(e.detail.value!)} 
            label={t('common.date', 'Fecha')} 
            labelPlacement="floating" 
          />
        </IonItem>
        <IonItem className="glass-input" lines="none">
          <IonSelect value={categoryId} onIonChange={e => setCategoryId(e.detail.value)} label={t('common.category')} labelPlacement="floating">
            {categories.filter(c => c.type === type).map(c => (
              <IonSelectOption key={c.id} value={c.id}>
                {c.parent_id ? `- ${c.name}` : c.name}
              </IonSelectOption>
            ))}
          </IonSelect>
        </IonItem>
        <div style={{ position: 'relative', zIndex: 10 }}>
          <IonItem className="glass-input" lines="none">
            <IonInput 
              value={description} 
              onIonInput={e => {
                const val = e.detail.value!;
                setDescription(val);
                if (val.trim().length > 0) {
                  const matches = frequentTransactions.filter(ft => ft.description.toLowerCase().includes(val.toLowerCase()));
                  setFilteredSuggestions(matches);
                  setShowSuggestions(matches.length > 0);
                } else {
                  setShowSuggestions(false);
                }
              }} 
              onIonFocus={() => {
                if (description.trim().length > 0 && filteredSuggestions.length > 0) setShowSuggestions(true);
              }}
              onIonBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              label={t('common.description')} 
              labelPlacement="floating" 
            />
          </IonItem>
          {showSuggestions && (
            <div style={{ position: 'absolute', top: '100%', left: '0', right: '0', zIndex: 50, background: 'rgba(30, 30, 45, 0.95)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', maxHeight: '200px', overflowY: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', marginTop: '4px' }}>
              {filteredSuggestions.map((ft, idx) => {
                const cat = categories.find(c => c.id === ft.category_id);
                const acc = accounts.find(a => a.id === ft.account_id);
                return (
                  <div key={idx} style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', cursor: 'pointer' }} onClick={() => {
                    setDescription(ft.description);
                    setCategoryId(ft.category_id);
                    setAccountId(ft.account_id);
                    if (ft.type && !transaction) setType(ft.type);
                    setShowSuggestions(false);
                  }}>
                    <div style={{ fontWeight: 600, color: '#fff', fontSize: '15px' }}>{ft.description}</div>
                    <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>
                      {cat?.name || 'Categoría'} • {acc?.name || 'Cuenta'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <IonItem className="glass-input" lines="none">
          <IonSelect multiple value={selectedTags} onIonChange={e => setSelectedTags(e.detail.value)} label="Etiquetas" labelPlacement="floating">
            {availableTags.map(tag => (
              <IonSelectOption key={tag.id} value={tag.id}>{tag.name}</IonSelectOption>
            ))}
          </IonSelect>
        </IonItem>
        <IonButton fill="clear" size="small" onClick={async () => {
          const name = window.prompt('Nombre de la nueva etiqueta:');
          if (name) {
            try {
              const newTag = await tagService.createTag(name);
              setAvailableTags(prev => [...prev, newTag]);
              setSelectedTags(prev => [...prev, newTag.id]);
            } catch (err) {
              console.error(err);
            }
          }
        }}>+ Crear Etiqueta</IonButton>
        
        <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#94a3b8', marginTop: '20px', marginBottom: '8px' }}>Adjuntos</h3>
        
        {attachments.map(att => (
          <IonItem key={att.id} className="glass-input" lines="none" style={{ marginBottom: '8px' }}>
            <IonIcon icon={documentOutline} slot="start" />
            <IonLabel>
              <a 
                href="#" 
                onClick={async (e) => {
                  e.preventDefault();
                  try {
                    const url = await attachmentService.fetchAttachmentBlobUrl(att.id);
                    window.open(url, '_blank');
                  } catch (err) {
                    console.error(err);
                  }
                }}
                style={{ color: '#fff', textDecoration: 'none' }}
              >
                {att.filename}
              </a>
            </IonLabel>
            <IonButton slot="end" color="danger" fill="clear" onClick={async () => {
              if(window.confirm('¿Eliminar adjunto?')) {
                await attachmentService.deleteAttachment(att.id);
                setAttachments(attachments.filter(a => a.id !== att.id));
              }
            }}>
              <IonIcon icon={trashOutline} />
            </IonButton>
          </IonItem>
        ))}

        {pendingFile && (
          <IonItem className="glass-input" lines="none" style={{ marginBottom: '8px' }}>
            <IonIcon icon={documentOutline} slot="start" color="warning" />
            <IonLabel color="warning">{pendingFile.name} (Pendiente)</IonLabel>
            <IonButton slot="end" color="danger" fill="clear" onClick={() => setPendingFile(null)}>
              <IonIcon icon={trashOutline} />
            </IonButton>
          </IonItem>
        )}

        <div style={{ marginTop: '8px' }}>
          <input 
            type="file" 
            id="file-upload" 
            style={{ display: 'none' }} 
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                setPendingFile(e.target.files[0]);
              }
            }}
          />
          <IonButton fill="outline" shape="round" color="primary" onClick={() => document.getElementById('file-upload')?.click()}>
            <IonIcon slot="start" icon={attachOutline} />
            Seleccionar Archivo
          </IonButton>
        </div>

        <IonButton expand="block" shape="round" className="ion-margin-top" style={{ height: '50px', '--background': 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)', fontWeight: 600, fontSize: '16px', marginTop: '24px' }} onClick={handleSave}>
          {t('common.save')}
        </IonButton>
      </IonContent>
    </IonModal>
  );
};

export default TransactionModal;
