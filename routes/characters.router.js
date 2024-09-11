import express from 'express';
import Joi from 'joi';
import { prisma } from '../utils/prisma/prismaClient.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import authCharMiddleware from '../middlewares/auth-character.middleware.js';

const router = express.Router();

const characterSchema = Joi.object({
  name: Joi.string().min(2).max(12).required().messages({
    'string.min': '캐릭터명은 2글자 이상이어야 합니다.',
    'string.max': '캐릭터명은 12글자를 넘을 수 없습니다.',
    'any.required': '캐릭터명을 입력해주세요.',
  }),
});

// 캐릭터 생성 API
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    // 캐릭터 이름 검증
    const { name } = await characterSchema.validateAsync(req.body);
    const userId = req.user.id;

    // 캐릭터 이름 중복 검사
    const existingCharacter = await prisma.character.findUnique({
      where: { name },
    });

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

    return res.status(201).json({ message: '캐릭터 생성 성공', characterId: character.id });
  } catch (error) {
    next(error);
  }
});

// 캐릭터 삭제 API
router.delete('/:characterId', authMiddleware, authCharMiddleware, async (req, res, next) => {
  try {
    const character = req.character;
    // DB에서 캐릭터 삭제
    await prisma.character.delete({ where: { id: character.id } });

    return res.status(200).json({ message: '캐릭터 삭제 성공' });
  } catch (error) {
    next(error);
  }
});

// 캐릭터 목록 조회 API (본인의 캐릭터만 조회)
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    // req.user에서 id를 추출
    const userId = req.user.id;

    // 로그인한 사용자의 userId와 일치하는 캐릭터만 조회
    const characters = await prisma.character.findMany({
      where: {
        userId: userId, // 사용자의 캐릭터만 조회
      },
      select: {
        id: true,
        name: true,
        health: true,
        power: true,
      },
    });

    // 캐릭터들의 정보를 담은 응답 생성
    const response = characters.map((character) => ({
      id: character.id,
      name: character.name,
      health: character.health,
      power: character.power,
    }));

    // 응답 반환
    return res.status(200).json(response);
  } catch (error) {
    next(error);
  }
});

// 캐릭터 상세 조회 API
router.get('/:characterId', async (req, res, next) => {
  try {
    const { characterId } = await characterIdSchema.validateAsync({
      characterId: req.params.characterId,
    });

    // 로그인 한 경우
    if (req.headers['authorization']) {
      try {
        await authMiddleware(req, res, () => {});
        if (!req.user) return;
      } catch (error) {
        return;
      }
    }
    const userId = req.user?.id;

    // 파라미터의 characterId로 캐릭터 검색
    const character = await prisma.character.findUnique({
      where: { id: characterId },
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

    return res.status(200).json(response);
  } catch (error) {
    next(error);
  }
});

export default router;
