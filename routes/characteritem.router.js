import express from 'express';
import Joi from 'joi';
import { prisma } from '../utils/prisma/prismaClient.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

const characterIdSchema = Joi.object({
  characterId: Joi.number().integer().required().messages({
    'number.base': '캐릭터 아이디는 숫자여야 합니다.',
    'number.integer': '캐릭터 아이디는 정수여야 합니다.',
    'any.required': '캐릭터 아이디를 입력해주세요.',
  }),
});

// 게임 머니 획득 API
router.post('/:characterId/getmoney', authMiddleware, async (req, res, next) => {
  try {
    // 파라미터 값 검증
    const { characterId } = await characterIdSchema.validateAsync(req.params);
    const userId = req.user.id;

    // 캐릭터 검색
    const character = await prisma.character.findFirst({
      where: { id: characterId },
    });
    if (!character) {
      const error = new Error('캐릭터를 찾을 수 없습니다.');
      error.status = 404;
      throw error;
    }

    // 본인 캐릭터가 아닌 경우
    if (character.userId !== userId) {
      const error = new Error('이 캐릭터를 조작할 권한이 없습니다.');
      error.status = 403;
      throw error;
    }

    // 캐릭터의 money 증가
    const updatedCharacter = await prisma.character.update({
      where: { id: characterId },
      data: {
        money: (character.money += 200),
      },
    });

    return res.status(200).json({
      message: '200 골드 획득!',
      name: updatedCharacter.name,
      money: updatedCharacter.money,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
