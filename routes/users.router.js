import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma/prismaClient.js';
import { userSchema, loginSchema } from '../utils/Joi/validationSchemas.js';

const router = express.Router();

// 회원가입 API
router.post('/sign-up', async (req, res, next) => {
  try {
    // Joi로 유효성 검증
    const { username, password, confirmPassword, name } = await userSchema.validateAsync(req.body);

    // 입력된 username이 이미 존재하는지 검색
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

    // 입력된 password는 해시처리되어 DB에 저장
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

    // 유저가 입력한 username이 DB에 존재하는지 검색
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      const error = new Error('사용자를 찾을 수 없습니다.');
      error.status = 401;
      throw error;
    }

    // 유저가 입력한 password가 DB에 저장된 password와 일치하는지 검사
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      const error = new Error('비밀번호가 일치하지 않습니다.');
      error.status = 401;
      throw error;
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.header('authorization', `Bearer ${token}`);
    res.status(200).json({ message: '로그인 성공', token });
  } catch (error) {
    next(error);
  }
});

export default router;
