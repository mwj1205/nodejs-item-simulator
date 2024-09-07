import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma/prismaClient.js';

export default async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];

    if (!authHeader) throw new Error('토큰이 존재하지 않습니다.');

    const [tokenType, token] = authHeader.split(' ');

    if (tokenType !== 'Bearer') throw new Error('잘못된 token 형식입니다.');
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decodedToken.userId;

    const user = await prisma.user.findFirst({
      where: { id: parseInt(userId) },
    });
    if (!user) {
      throw new Error('토큰 사용자가 존재하지 않습니다.');
    }

    // req.user에 사용자 정보를 저장합니다.
    req.user = user;
    console.log('req.user: ', req.user);

    next();
  } catch (error) {
    // 토큰이 만료되었거나, 조작되었을 때, 에러 메시지를 다르게 출력합니다.\
    switch (error.name) {
      case 'TokenExpiredError':
        return res.status(401).json({ message: '토큰이 만료되었습니다.' });
      case 'JsonWebTokenError':
        return res.status(401).json({ message: '토큰이 조작되었습니다.' });
      default:
        return res.status(401).json({ message: error.message ?? '비정상적인 요청입니다.' });
    }
  }
}
