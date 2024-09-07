import express from 'express';
import Joi from 'joi';
import { prisma } from '../utils/prisma/prismaClient.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

const characterSchema = Joi.object({
  name: Joi.string().required(),
});

// 캐릭터 생성 API
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    // 캐릭터 이름 검증
    const { name } = await characterSchema.validateAsync(req.body);
    const userId = req.user.id;

    // 캐릭터 이름 중복 검사
    const existingCharacter = await prisma.character.findUnique({ where: { name } });
    if (existingCharacter) {
      const error = new Error('이미 존재하는 캐릭터 이름입니다.');
      error.status = 400;
      throw error;
    }

    // 캐릭터 생성
    const character = await prisma.character.create({
      data: {
        name,
        userId,
        health: 500,
        power: 100,
        money: 10000,
      },
    });

    res.status(201).json({ message: '캐릭터 생성 성공', characterId: character.id });
  } catch (error) {
    next(error);
  }
});

// 캐릭터 상세 조회 API
router.get('/:characterId', async (req, res, next) => {
  try {
    const { characterId } = req.params;
    let userId = req.user ? req.user.id : null;

    // 로그인 한 경우
    if (req.headers['authorization']) {
      try {
        await authMiddleware(req, res, () => {});
      } catch (a) {
        return;
      }
    }
    userId = req.user?.id;

    // 파라미터의 characterId로 캐릭터 검색
    const character = await prisma.character.findUnique({
      where: { id: parseInt(characterId) },
      include: { user: true },
    });

    if (!character) {
      const error = new Error('캐릭터를 찾을 수 없습니다.');
      error.status = 404;
      throw error;
    }

    // 로그인 하지 않았거나 다른 유저가 내 캐릭터를 조회하는 경우
    const response = {
      name: character.name,
      health: character.health,
      power: character.power,
    };

    // 내가 내 캐릭터를 조회하는 경우 money 추가
    if (userId && character.userId === userId) {
      response.money = character.money;
    }

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
});

export default router;
