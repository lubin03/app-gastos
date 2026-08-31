import { api } from './api';

export interface Tag {
  id: string;
  name: string;
  created_at: string;
}

export const tagService = {
  getTags: async (): Promise<Tag[]> => {
    const response = await api.get('/tags');
    return response;
  },

  createTag: async (name: string): Promise<Tag> => {
    const response = await api.post('/tags', { name });
    return response;
  },

  deleteTag: async (id: string): Promise<void> => {
    await api.delete(`/tags/${id}`);
  }
};
