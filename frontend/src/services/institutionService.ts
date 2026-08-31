import { api } from './api';

export interface Institution {
  id: string;
  name: string;
  code: string;
  logo_url: string;
  primary_color: string;
}

export const institutionService = {
  getInstitutions: async (): Promise<Institution[]> => {
    const response = await api.get('/institutions');
    return response;
  }
};
