import express from 'express';
import Joi from 'joi';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma/prismaClient.js';

const router = express.Router();

const userSchema = Joi.object({
  username: Joi.string()
    .pattern(/^[a-z0-9]+$/)
    .min(3)
    .max(30)
    .required()
    .messages({
      'string.pattern.base': '아이디는 소문자와 숫자만 포함되어야 합니다.',
      'string.min': '아이디는 3글자 이상이어야 합니다.',
      'string.max': '아이디는 30글자를 넘을 수 없습니다.',
      'any.required': '아이디를 입력해주세요.',
    }),
  password: Joi.string().min(6).required().messages({
    'string.min': '비밀번호는 6글자 이상이어야 합니다.',
    'any.required': '비밀번호를 입력해주세요.',
  }),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
    'any.only': '비밀번호가 일치하지 않습니다.',
    'any.required': '비밀번호 확인을 입력해주세요.',
  }),
  name: Joi.string().required().messages({
    'any.required': '닉네임을 입력해주세요.',
  }),
});

const loginSchema = Joi.object({
  username: Joi.string().required().messages({
    'any.required': '아이디를 입력해주세요.',
  }),
  password: Joi.string().required().messages({
    'any.required': '비밀번호를 입력해주세요.',
  }),
});

// 회원가입 API
router.post('/sign-up', async (req, res, next) => {
  try {
    const { username, password, confirmPassword, name } = await userSchema.validateAsync(req.body);

    const isExistUser = await prisma.user.findUnique({
      where: {
        username,
      },
    });

    if (isExistUser) {
      const error = new Error('이미 존재하는 사용자명입니다.');
      error.status = 409;
      throw error;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name,
      },
    });

    return res
      .status(201)
      .json({ message: '회원가입이 완료되었습니다.', username: user.username, name: user.name });
  } catch (error) {
    next(error);
  }
});

// 로그인 API
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = await loginSchema.validateAsync(req.body);

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      const error = new Error('사용자를 찾을 수 없습니다.');
      error.status = 401;
      throw error;
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      const error = new Error('비밀번호가 일치하지 않습니다.');
      error.status = 401;
      throw error;
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ message: '로그인 성공', token });
  } catch (error) {
    next(error);
  }
});

export default router;
