import express from 'express';
import Joi from 'joi';
import { prisma } from '../utils/prisma/prismaClient.js';
import { itemPurchaseSchema } from '../utils/Joi/validationSchemas.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import authCharMiddleware from '../middlewares/auth-character.middleware.js';

const router = express.Router();

// 아이템 구입 API
router.post('/:characterId/buyitem', authMiddleware, authCharMiddleware, async (req, res, next) => {
  try {
    // 바디 검증
    const items = await itemPurchaseSchema.validateAsync(req.body);

    const character = req.character;

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
router.post(
  '/:characterId/getmoney',
  authMiddleware,
  authCharMiddleware,
  async (req, res, next) => {
    try {
      const character = req.character;

      // 캐릭터의 money 증가
      const updatedCharacter = await prisma.character.update({
        where: { id: character.id },
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
  },
);

export default router;
