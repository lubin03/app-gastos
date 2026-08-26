import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { createUser, getUserByEmail, getUserByGoogleId, getUserById, updateUser, saveResetToken, getUserByResetToken, updatePasswordAndClearToken } from '../models/user';
import { encrypt, decrypt } from '../utils/crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, name, password } = req.body;
    if (!email || !name || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await createUser(email, name, passwordHash);

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user.id, name, email, isGoogle: false } });
  } catch (error) {
    console.error('Register error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing email or password' });
    }

    const user = await getUserByEmail(email);
    if (!user || !user.password_hash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.status(200).json({ 
      token, 
      user: { 
        id: user.id, 
        name: decrypt(user.name_encrypted), 
        email,
        isGoogle: !!user.google_id
      } 
    });
  } catch (error) {
    console.error('Login error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const googleAuth = async (req: Request, res: Response) => {
  try {
    const { googleId, email, name } = req.body;
    if (!googleId || !email || !name) {
      return res.status(400).json({ error: 'Missing google profile data' });
    }

    let user = await getUserByGoogleId(googleId);
    if (!user) {
      // Check if email already exists
      user = await getUserByEmail(email);
      if (user) {
        // We could link accounts here, but for simplicity we return error or update
        return res.status(409).json({ error: 'Email already registered with password' });
      } else {
        user = await createUser(email, name, undefined, googleId);
      }
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.status(200).json({ 
      token, 
      user: { 
        id: user.id, 
        name: decrypt(user.name_encrypted), 
        email,
        isGoogle: true
      } 
    });
  } catch (error) {
    console.error('Google Auth error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.status(200).json({
      id: user.id,
      name: decrypt(user.name_encrypted),
      email: decrypt(user.email_encrypted),
      isGoogle: !!user.google_id
    });
  } catch (error) {
    console.error('Get me error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { newEmail, currentPassword, newPassword } = req.body;

    if (!newEmail) {
      return res.status(400).json({ error: 'New email is required' });
    }

    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if the new email is already in use by someone else
    const existingUser = await getUserByEmail(newEmail);
    if (existingUser && existingUser.id !== userId) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    let passwordHash = undefined;

    if (user.google_id) {
      // Google users cannot change their password via this endpoint
      if (newPassword || currentPassword) {
        return res.status(403).json({ error: 'Google accounts cannot set a password here' });
      }
    } else {
      // Normal users MUST provide currentPassword to change anything
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required to update profile' });
      }
      
      const isMatch = await bcrypt.compare(currentPassword, user.password_hash || '');
      if (!isMatch) {
        return res.status(401).json({ error: 'Incorrect current password' });
      }

      if (newPassword) {
        passwordHash = await bcrypt.hash(newPassword, 10);
      }
    }

    await updateUser(userId, newEmail, passwordHash);

    res.status(200).json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await getUserByEmail(email);
    if (!user) {
      // Don't leak whether the user exists or not
      return res.status(200).json({ message: 'If the email exists, a reset link has been generated.' });
    }

    if (user.google_id) {
      return res.status(400).json({ error: 'This is a Google account. Please use Google Login.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await saveResetToken(user.id, resetToken, expiresAt);

    // Simulate sending email by logging to console
    const resetLink = `http://localhost:5173/reset-password?token=${resetToken}`;
    console.log(`\n\n[SIMULATED EMAIL]`);
    console.log(`To: ${email}`);
    console.log(`Subject: Password Reset Request`);
    console.log(`Body: Click this link to reset your password: ${resetLink}\n\n`);

    res.status(200).json({ message: 'If the email exists, a reset link has been generated.' });
  } catch (error) {
    console.error('Forgot password error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    const user = await getUserByResetToken(token);
    
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    // Check expiration
    if (!user.reset_token_expires || new Date() > user.reset_token_expires) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await updatePasswordAndClearToken(user.id, passwordHash);

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Reset password error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
