import { Router } from 'express';
import { z } from 'zod';
import { User } from '../../models/user.js';
import { hashPassword, comparePassword, generateToken } from '../../utils/auth.js';
import { authenticateToken, AuthenticatedRequest } from '../../middleware/auth.js';

export const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(1).max(120),
  password: z.string().min(6).max(100),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Register
authRouter.post('/register', async (req, res, next) => {
  try {
    const input = registerSchema.parse(req.body);
    
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email: input.email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(input.password);
    const user = await User.create({
      email: input.email,
      displayName: input.displayName,
      password: hashedPassword,
    });

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      },
      token,
    });
  } catch (err) {
    next(err);
  }
});

// Login
authRouter.post('/login', async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body);
    
    // Find user by email
    const user = await User.findOne({ where: { email: input.email } });
    if (!user || !user.password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password
    const isValidPassword = await comparePassword(input.password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate token
    const token = generateToken(user.id);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      },
      token,
    });
  } catch (err) {
    next(err);
  }
});

// Get current user
authRouter.get('/me', authenticateToken, async (req: AuthenticatedRequest, res) => {
  res.json({
    user: {
      id: req.user!.id,
      email: req.user!.email,
      displayName: req.user!.displayName,
    },
  });
});

// Update profile
authRouter.put('/profile', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const updateSchema = z.object({
      displayName: z.string().min(1).max(120).optional(),
      email: z.string().email().optional(),
    });
    
    const input = updateSchema.parse(req.body);
    
    // Check if email is being changed and if it's already taken
    if (input.email && input.email !== req.user!.email) {
      const existingUser = await User.findOne({ where: { email: input.email } });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already taken' });
      }
    }

    await req.user!.update(input);
    
    res.json({
      user: {
        id: req.user!.id,
        email: req.user!.email,
        displayName: req.user!.displayName,
      },
    });
  } catch (err) {
    next(err);
  }
});

// Change password
authRouter.put('/password', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const passwordSchema = z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(6).max(100),
    });
    
    const input = passwordSchema.parse(req.body);
    
    if (!req.user!.password) {
      return res.status(400).json({ error: 'No password set for this account' });
    }

    // Verify current password
    const isValidPassword = await comparePassword(input.currentPassword, req.user!.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Update password
    const hashedPassword = await hashPassword(input.newPassword);
    await req.user!.update({ password: hashedPassword });

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
});

