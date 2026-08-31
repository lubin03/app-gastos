import { api } from './api';

export interface Attachment {
  id: string;
  filename: string;
  content_type: string;
  created_at: string;
}

export const attachmentService = {
  getAttachmentsByTransaction: async (transactionId: string): Promise<Attachment[]> => {
    const response = await api.get(`/attachments/transaction/${transactionId}`);
    return response;
  },

  uploadAttachment: async (transactionId: string, file: File): Promise<Attachment> => {
    const formData = new FormData();
    formData.append('transactionId', transactionId);
    formData.append('file', file);
    
    const response = await api.post('/attachments', formData, {
      headers: {
        // fetch handles multipart boundary automatically if we don't set Content-Type manually,
        // but since our api wrapper might force application/json, we need to pass a special flag or override.
        // Actually, if we delete Content-Type from headers in api.ts, fetch will set it properly.
      }
    });
    return response;
  },

  deleteAttachment: async (id: string): Promise<void> => {
    await api.delete(`/attachments/${id}`);
  },

  getAttachmentUrl: (id: string): string => {
    // We assume the token might be needed, but for <img> or <a> tags, the browser doesn't send Bearer token.
    // If the getAttachment endpoint requires Auth, we need to fetch it via API and create a Blob URL.
    return `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/attachments/${id}`;
  },

  fetchAttachmentBlobUrl: async (id: string): Promise<string> => {
    // We bypass api.get to use fetch directly to get a Blob
    const token = localStorage.getItem('token');
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/attachments/${id}`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    const blob = await response.blob();
    return window.URL.createObjectURL(blob);
  }
};
