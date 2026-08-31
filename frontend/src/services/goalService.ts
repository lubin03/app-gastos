import { api } from './api';

export interface Goal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline?: string;
  icon?: string;
  created_at: string;
}

export const goalService = {
  getGoals: async (): Promise<Goal[]> => {
    const response = await api.get('/goals');
    return response;
  },

  createGoal: async (goal: Partial<Goal>): Promise<Goal> => {
    const response = await api.post('/goals', goal);
    return response;
  },

  updateGoal: async (id: string, goal: Partial<Goal>): Promise<Goal> => {
    const response = await api.put(`/goals/${id}`, goal);
    return response;
  },

  deleteGoal: async (id: string): Promise<void> => {
    await api.delete(`/goals/${id}`);
  }
};
