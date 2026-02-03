import { Router } from 'express';
import { ApiResponse } from '@ai-data-assistant/shared';
import logger from '../config/logger';
import crypto from 'crypto';

const router = Router();

// Simple in-memory user store (in production, use Supabase Auth or a database)
interface User {
  id: string;
  email: string;
  password: string; // hashed
  name?: string;
  role: string;
  createdAt: Date;
}

// Usuários do sistema - em produção, usar banco de dados
const users: Map<string, User> = new Map();

// Criar usuário padrão: menezessluciana@gmail.com
const defaultUser: User = {
  id: crypto.randomUUID(),
  email: 'menezessluciana@gmail.com',
  password: hashPassword('admin123'), // Senha padrão - altere em produção!
  name: 'Luciana Menezes',
  role: 'admin',
  createdAt: new Date()
};
users.set(defaultUser.email, defaultUser);

// Hash password function
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Generate simple token
function generateToken(userId: string): string {
  const payload = {
    userId,
    timestamp: Date.now(),
    random: crypto.randomBytes(16).toString('hex')
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      const response: ApiResponse = {
        success: false,
        error: 'Email e senha são obrigatórios'
      };
      return res.status(400).json(response);
    }

    const user = users.get(email.toLowerCase());

    if (!user) {
      logger.warn(`Login attempt failed: user not found - ${email}`);
      const response: ApiResponse = {
        success: false,
        error: 'Email ou senha inválidos'
      };
      return res.status(401).json(response);
    }

    const hashedPassword = hashPassword(password);

    if (user.password !== hashedPassword) {
      logger.warn(`Login attempt failed: wrong password - ${email}`);
      const response: ApiResponse = {
        success: false,
        error: 'Email ou senha inválidos'
      };
      return res.status(401).json(response);
    }

    const token = generateToken(user.id);

    logger.info(`User logged in: ${email}`);

    const response: ApiResponse = {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          createdAt: user.createdAt.toISOString()
        },
        token
      },
      message: 'Login realizado com sucesso'
    };

    res.json(response);
  } catch (error) {
    logger.error('Error during login:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Erro interno do servidor'
    };
    res.status(500).json(response);
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      const response: ApiResponse = {
        success: false,
        error: 'Email e senha são obrigatórios'
      };
      return res.status(400).json(response);
    }

    if (password.length < 6) {
      const response: ApiResponse = {
        success: false,
        error: 'A senha deve ter pelo menos 6 caracteres'
      };
      return res.status(400).json(response);
    }

    const normalizedEmail = email.toLowerCase();

    if (users.has(normalizedEmail)) {
      const response: ApiResponse = {
        success: false,
        error: 'Este email já está cadastrado'
      };
      return res.status(400).json(response);
    }

    const newUser: User = {
      id: crypto.randomUUID(),
      email: normalizedEmail,
      password: hashPassword(password),
      name: name || undefined,
      role: 'user',
      createdAt: new Date()
    };

    users.set(normalizedEmail, newUser);

    const token = generateToken(newUser.id);

    logger.info(`New user registered: ${normalizedEmail}`);

    const response: ApiResponse = {
      success: true,
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          createdAt: newUser.createdAt.toISOString()
        },
        token
      },
      message: 'Conta criada com sucesso'
    };

    res.status(201).json(response);
  } catch (error) {
    logger.error('Error during registration:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Erro interno do servidor'
    };
    res.status(500).json(response);
  }
});

// GET /api/auth/me - Get current user info
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const response: ApiResponse = {
        success: false,
        error: 'Token não fornecido'
      };
      return res.status(401).json(response);
    }

    const token = authHeader.substring(7);

    try {
      const payload = JSON.parse(Buffer.from(token, 'base64').toString());
      const userId = payload.userId;

      // Find user by ID
      let foundUser: User | undefined;
      for (const user of users.values()) {
        if (user.id === userId) {
          foundUser = user;
          break;
        }
      }

      if (!foundUser) {
        const response: ApiResponse = {
          success: false,
          error: 'Usuário não encontrado'
        };
        return res.status(401).json(response);
      }

      const response: ApiResponse = {
        success: true,
        data: {
          user: {
            id: foundUser.id,
            email: foundUser.email,
            name: foundUser.name,
            role: foundUser.role,
            createdAt: foundUser.createdAt.toISOString()
          }
        }
      };

      res.json(response);
    } catch {
      const response: ApiResponse = {
        success: false,
        error: 'Token inválido'
      };
      return res.status(401).json(response);
    }
  } catch (error) {
    logger.error('Error getting user info:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Erro interno do servidor'
    };
    res.status(500).json(response);
  }
});

export default router;
