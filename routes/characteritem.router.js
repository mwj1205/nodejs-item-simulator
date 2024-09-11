import express from 'express';
import Joi from 'joi';
import { prisma } from '../utils/prisma/prismaClient.js';
import { itemPurchaseSaleSchema } from '../utils/Joi/validationSchemas.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import authCharMiddleware from '../middlewares/auth-character.middleware.js';

const router = express.Router();

// 아이템 구입 API
router.post('/:characterId/buyitem', authMiddleware, authCharMiddleware, async (req, res, next) => {
  try {
    // 바디 검증
    const items = await itemPurchaseSaleSchema.validateAsync(req.body);

    const character = req.character;

    // 전체 가격 계산
    let totalCost = 0;
    for (const item of items) {
      // 아이템 검색
      const findItem = await prisma.item.findFirst({
        where: { code: item.code },
      });
      if (!findItem) {
        const error = new Error(`유효하지 않은 아이템 코드: ${item.code} `);
        error.status = 404;
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

// 아이템 판매 API
router.post(
  '/:characterId/sellitem',
  authMiddleware,
  authCharMiddleware,
  async (req, res, next) => {
    try {
      // 바디 검증
      const items = await itemPurchaseSaleSchema.validateAsync(req.body);
      const character = req.character;

      let totalMoney = 0;
      const characterInventory = [];
      for (const item of items) {
        const findItem = await prisma.characterItem.findUnique({
          where: {
            characterId_itemCode: {
              characterId: character.id,
              itemCode: item.code,
            },
          },
          include: {
            item: true,
          },
        });
        if (!findItem) {
          const error = new Error(`아이템이 인벤토리에 존재하지 않습니다. code: ${item.code}`);
          error.status = 404;
          throw error;
        }
        if (findItem.quantity < item.count) {
          const error = new Error(
            `판매하려는 수량이 보유한 아이템 수량보다 많습니다. code: ${item.code}`,
          );
          error.status = 400;
          throw error;
        }

        totalMoney += Math.floor(findItem.item.price * 0.6) * item.count;
        characterInventory.push({ id: findItem.id, quantity: findItem.quantity });
      }

      // 트랜젝션 시작
      const updatedCharacter = await prisma.$transaction(async (prisma) => {
        // 캐릭터 돈 증가
        const updatedCharacter = await prisma.character.update({
          where: { id: character.id },
          data: {
            money: { increment: totalMoney },
          },
        });
        // 아이템 제거 또는 수량 감소
        for (let i = 0; i < items.length; i++) {
          const inventoryItem = characterInventory[i];
          const cellItem = items[i];

          // 판매 수량과 보유 수량이 같으면 삭제
          if (inventoryItem.quantity === cellItem.count) {
            await prisma.characterItem.delete({
              where: {
                characterId_itemCode: {
                  characterId: character.id,
                  itemCode: cellItem.code,
                },
              },
            });
          } else {
            // 보유 수량이 더 많은 경우
            await prisma.characterItem.update({
              where: {
                characterId_itemCode: {
                  characterId: character.id,
                  itemCode: cellItem.code,
                },
              },
              data: { quantity: { decrement: cellItem.count } },
            });
          }
        }

        return updatedCharacter;
      });
      return res
        .status(200)
        .json({ message: '아이템 판매 성공', remaining_money: updatedCharacter.money });
    } catch (error) {
      next(error);
    }
  },
);

// 캐릭터 인벤토리 조회 API
router.get(
  '/:characterId/inventory',
  authMiddleware,
  authCharMiddleware,
  async (req, res, next) => {
    try {
      const character = req.character;

      const inventory = await prisma.characterItem.findMany({
        where: { characterId: character.id },
        include: { item: true },
      });

      const resInventory = inventory.map((inventory) => ({
        code: inventory.item.code,
        name: inventory.item.name,
        count: inventory.quantity,
      }));

      return res.status(200).json(resInventory);
    } catch (error) {
      next(error);
    }
  },
);

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
          money: { increment: 200 },
        },
      });

      // 게임 머니를 획득한 캐릭터의 이름과 잔액 게임 머니 반환
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
