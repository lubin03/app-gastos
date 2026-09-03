import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';

dotenv.config();

import { register, login, googleAuth, getMe, updateProfile, forgotPassword, resetPassword } from './controllers/auth';
import { createAccount, getAccounts, updateAccount, deleteAccount, payCreditCard } from './controllers/accounts';
import { getCategories, createCategory, updateCategory, deleteCategory } from './controllers/categories';
import { createTransaction, getTransactions, updateTransaction, deleteTransaction, getTransactionYears, deleteAllTransactions, getFrequentTransactions } from './controllers/transactions';
import { createBudget, getBudgets, updateBudget, deleteBudget } from './controllers/budgets';
import { importTransactions, exportTransactions } from './controllers/importExport';
import { getDashboardStats } from './controllers/dashboard';
import { getInsights } from './controllers/insights';
import { createMagicTransaction } from './controllers/magic';
import { requireAuth as authenticate } from './middleware/auth';
import { runMigrations } from './db/migrate';
import reportsRoutes from './routes/reports';
import creditCardRoutes from './routes/creditCards';
import tagsRoutes from './routes/tags';
import attachmentsRoutes from './routes/attachments';
import goalsRoutes from './routes/goals';
import institutionsRoutes from './routes/institutions';

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

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

// Reports Route
app.use('/api/reports', reportsRoutes);

// Insights Route
app.get('/api/insights', authenticate, getInsights);

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

// Credit Cards Routes
app.use('/api/credit-cards', creditCardRoutes);

// Tags Routes
app.use('/api/tags', tagsRoutes);

// Attachments Routes
app.use('/api/attachments', attachmentsRoutes);

// Goals Routes
app.use('/api/goals', goalsRoutes);

// Institutions Routes
app.use('/api/institutions', institutionsRoutes);

// Transactions Routes
app.get('/api/transactions/frequent', authenticate, getFrequentTransactions);
app.post('/api/transactions/magic', authenticate, createMagicTransaction);
app.delete('/api/transactions/all', authenticate, deleteAllTransactions);
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
