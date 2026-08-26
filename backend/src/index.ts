import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';

dotenv.config();

import { register, login, googleAuth, getMe, updateProfile, forgotPassword, resetPassword } from './controllers/auth';
import { createAccount, getAccounts, updateAccount, deleteAccount, payCreditCard } from './controllers/accounts';
import { getCategories, createCategory, updateCategory, deleteCategory } from './controllers/categories';
import { createTransaction, getTransactions, updateTransaction, deleteTransaction, getTransactionYears } from './controllers/transactions';
import { createBudget, getBudgets, updateBudget, deleteBudget } from './controllers/budgets';
import { importTransactions, exportTransactions } from './controllers/importExport';
import { getDashboardStats } from './controllers/dashboard';
import { createMagicTransaction } from './controllers/magic';
import { requireAuth as authenticate } from './middleware/auth';
import { runMigrations } from './db/migrate';

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Auth Routes
app.post('/api/auth/register', register);
app.post('/api/auth/login', login);
app.post('/api/auth/google', googleAuth);
app.get('/api/auth/me', authenticate, getMe);
app.put('/api/auth/profile', authenticate, updateProfile);
app.post('/api/auth/forgot-password', forgotPassword);
app.post('/api/auth/reset-password', resetPassword);

// Dashboard Route
app.get('/api/dashboard', authenticate, getDashboardStats);

// Accounts Routes
app.post('/api/accounts', authenticate, createAccount);
app.get('/api/accounts', authenticate, getAccounts);
app.put('/api/accounts/:id', authenticate, updateAccount);
app.delete('/api/accounts/:id', authenticate, deleteAccount);
app.post('/api/accounts/:id/pay', authenticate, payCreditCard);

// Categories Routes
app.get('/api/categories', authenticate, getCategories);
app.post('/api/categories', authenticate, createCategory);
app.put('/api/categories/:id', authenticate, updateCategory);
app.delete('/api/categories/:id', authenticate, deleteCategory);

// Transactions Routes
app.post('/api/transactions/magic', authenticate, createMagicTransaction);
app.post('/api/transactions', authenticate, createTransaction);
app.get('/api/transactions', authenticate, getTransactions);
app.get('/api/transactions/years', authenticate, getTransactionYears);
app.put('/api/transactions/:id', authenticate, updateTransaction);
app.delete('/api/transactions/:id', authenticate, deleteTransaction);
app.post('/api/transactions/import', authenticate, upload.single('file'), importTransactions);
app.get('/api/transactions/export', authenticate, exportTransactions);

// Budgets Routes
app.post('/api/budgets', authenticate, createBudget);
app.get('/api/budgets', authenticate, getBudgets);
app.put('/api/budgets/:id', authenticate, updateBudget);
app.delete('/api/budgets/:id', authenticate, deleteBudget);

// Run migrations and start server
runMigrations().then(() => {
  app.listen(port, () => {
    console.log(`Backend server running on http://localhost:${port}`);
  });
}).catch(err => {
  console.error("Failed to start server due to migration error:", err);
  process.exit(1);
});
