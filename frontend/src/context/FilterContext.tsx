import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

interface FilterContextType {
  startDate: string;
  endDate: string;
  availableYears: number[];
  setDateRange: (start: string, end: string) => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const getInitialDates = () => {
    const savedStart = localStorage.getItem('app_filter_startDate');
    const savedEnd = localStorage.getItem('app_filter_endDate');
    if (savedStart && savedEnd && /^\d{4}-\d{2}-\d{2}$/.test(savedStart) && /^\d{4}-\d{2}-\d{2}$/.test(savedEnd)) {
      return { startDate: savedStart, endDate: savedEnd };
    }

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    const lastDay = new Date(y, m, 0).getDate();
    
    return {
      startDate: `${y}-${pad(m)}-01`,
      endDate: `${y}-${pad(m)}-${pad(lastDay)}`
    };
  };

  const initial = getInitialDates();
  const [startDate, setStartDate] = useState(initial.startDate);
  const [endDate, setEndDate] = useState(initial.endDate);
  const [availableYears, setAvailableYears] = useState<number[]>([new Date().getFullYear()]);

  useEffect(() => {
    const fetchYears = async () => {
      try {
        const years = await api.get('/transactions/years');
        if (years && years.length > 0) {
          setAvailableYears(years);
        }
      } catch (err) {
        console.error('Failed to fetch years', err);
      }
    };
    
    // Only fetch if we have a token
    if (localStorage.getItem('token')) {
       fetchYears();
    }
  }, []);

  const setDateRange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    localStorage.setItem('app_filter_startDate', start);
    localStorage.setItem('app_filter_endDate', end);
  };

  return (
    <FilterContext.Provider value={{ startDate, endDate, availableYears, setDateRange }}>
      {children}
    </FilterContext.Provider>
  );
};

export const useFilter = () => {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilter must be used within a FilterProvider');
  }
  return context;
};
