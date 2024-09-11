import express from 'express';
import { prisma } from '../utils/prisma/prismaClient.js';
import { itemCodeEquipSchema } from '../utils/Joi/validationSchemas.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import authCharMiddleware from '../middlewares/auth-character.middleware.js';

const router = express.Router();

// 아이템 장착 API
router.post('/:characterId/equip', authMiddleware, authCharMiddleware, async (req, res, next) => {
  try {
    const character = req.character;
    const { code } = await itemCodeEquipSchema.validateAsync(req.body);

    // 장착하려는 아이템이 인벤토리에 존재하는지 확인
    const findItem = await prisma.characterItem.findUnique({
      where: {
        characterId_itemCode: {
          characterId: character.id,
          itemCode: code,
        },
      },
      include: {
        item: true,
      },
    });
    if (!findItem) {
      const error = new Error(`아이템이 인벤토리에 존재하지 않습니다.`);
      error.status = 404;
      throw error;
    }

    // 이미 장착하고 있는 아이템인지 확인
    const alreadyEquipped = await prisma.equippedItem.findUnique({
      where: {
        characterId_itemCode: {
          characterId: character.id,
          itemCode: code,
        },
      },
    });
    if (alreadyEquipped) {
      const error = new Error('이미 장착된 아이템입니다.');
      error.status = 400;
      throw error;
    }

    const updatedCharacter = await prisma.$transaction(async (prisma) => {
      // 아이템 장착 DB에 데이터 생성
      await prisma.equippedItem.create({
        data: {
          itemCode: findItem.itemCode,
          characterId: character.id,
        },
      });

      // 캐릭터의 스텟 업데이트
      const updatedCharacter = await prisma.character.update({
        where: { id: character.id },
        data: {
          health: { increment: findItem.item.health },
          power: { increment: findItem.item.power },
        },
      });

      // 아이템이 하나만 있다면 삭제
      if (findItem.quantity === 1) {
        await prisma.characterItem.delete({
          where: {
            characterId_itemCode: {
              characterId: character.id,
              itemCode: findItem.itemCode,
            },
          },
        });
      } else {
        // 두 개 이상이면 수량만 -1
        await prisma.characterItem.update({
          where: {
            characterId_itemCode: {
              characterId: character.id,
              itemCode: findItem.itemCode,
            },
          },
          data: {
            quantity: { decrement: 1 },
          },
        });
      }
      return updatedCharacter;
    });

    // 변경된 스텟 반환
    return res.status(200).json({
      health: updatedCharacter.health,
      power: updatedCharacter.power,
    });
  } catch (error) {
    next(error);
  }
});

// 아이템 탈착 API
router.post('/:characterId/unequip', authMiddleware, authCharMiddleware, async (req, res, next) => {
  try {
    const character = req.character;
    const { code } = await itemCodeEquipSchema.validateAsync(req.body);

    // 장착하고 있는 아이템인지 확인
    const alreadyEquipped = await prisma.equippedItem.findUnique({
      where: {
        characterId_itemCode: {
          characterId: character.id,
          itemCode: code,
        },
      },
      include: {
        item: true,
      },
    });
    if (!alreadyEquipped) {
      const error = new Error('장착 되어있지 않은 아이템입니다.');
      error.status = 400;
      throw error;
    }
    const updatedCharacter = await prisma.$transaction(async (prisma) => {
      // 장착된 아이템 DB에서 데이터 삭제
      await prisma.equippedItem.delete({
        where: {
          characterId_itemCode: {
            characterId: character.id,
            itemCode: alreadyEquipped.itemCode,
          },
        },
      });

      // 캐릭터의 스텟 업데이트
      const updatedCharacter = await prisma.character.update({
        where: { id: character.id },
        data: {
          health: { decrement: alreadyEquipped.item.health },
          power: { decrement: alreadyEquipped.item.power },
        },
      });

      // 인벤토리에 아이템 추가 이미 존재하면 quantity +1, 없다면 생성
      await prisma.characterItem.upsert({
        where: {
          characterId_itemCode: {
            characterId: character.id,
            itemCode: alreadyEquipped.itemCode,
          },
        },
        update: {
          quantity: { increment: 1 },
        },
        create: {
          characterId: character.id,
          itemCode: alreadyEquipped.itemCode,
          quantity: 1,
        },
      });
      return updatedCharacter;
    });

    // 변경된 스텟 반환
    return res.status(200).json({
      health: updatedCharacter.health,
      power: updatedCharacter.power,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
