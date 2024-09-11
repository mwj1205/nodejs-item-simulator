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

const itemSchema = Joi.array()
  .items(
    Joi.object({
      code: Joi.number().integer().required().messages({
        'number.base': '아이템 코드는 숫자여야 합니다.',
        'number.integer': '아이템 코드는 정수여야 합니다.',
        'any.required': '아이템 코드를 입력해주세요.',
      }),
      count: Joi.number().integer().min(1).required().messages({
        'number.base': '수량은 숫자여야 합니다.',
        'number.integer': '수량은 정수여야 합니다.',
        'number.min': '수량은 1 이상이어야 합니다.',
        'any.required': '수량을 입력해주세요.',
      }),
    }),
  )
  .min(1)
  .messages({
    'array.min': '적어도 하나의 아이템을 구입해야 합니다.',
  });

// 아이템 구입 API
router.post('/:characterId/buyitem', authMiddleware, async (req, res, next) => {
  try {
    // 파라미터 검증
    const { characterId } = await characterIdSchema.validateAsync({
      characterId: req.params.characterId,
    });

    // 바디 검증
    const items = await itemSchema.validateAsync(req.body);
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

    // 전체 가격 계산
    let totalCost = 0;
    for (const item of items) {
      // 아이템 검색
      const findItem = await prisma.item.findFirst({
        where: { code: item.code },
      });
      if (!findItem) {
        const error = new Error('유효하지 않은 아이템 코드입니다.');
        error.status = 400;
        throw error;
      }
      totalCost += findItem.price * item.count;
    }

    if (character.money < totalCost) {
      const error = new Error('골드가 부족합니다.');
      error.status = 400;
      throw error;
    }

    /* 트랜잭션 시작
    캐릭터의 정보 수정, 캐릭터의 소유 아이템 정보 수정을 동시에 하기 때문에
    트랜잭션으로 원자성을 지키도록 함
    */
    const updatedCharacter = await prisma.$transaction(async (prisma) => {
      // 캐릭터 돈 감소
      const updatedCharacter = await prisma.character.update({
        where: { id: character.id },
        data: {
          money: { decrement: totalCost },
        },
      });
      // 아이템 추가. 이미 소유한 아이템이라면 수량만 추가
      for (const item of items) {
        await prisma.characterItem.upsert({
          where: {
            characterId_itemCode: {
              characterId: character.id,
              itemCode: item.code,
            },
          },
          update: {
            quantity: { increment: item.count },
          },
          create: {
            characterId: character.id,
            itemCode: item.code,
            quantity: item.count,
          },
        });
      }
      return updatedCharacter;
    });

    return res
      .status(200)
      .json({ message: '아이템 구매 성공', remaining_money: updatedCharacter.money });
  } catch (error) {
    next(error);
  }
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
