import express from 'express';
import { prisma } from '../utils/prisma/prismaClient.js';
import { itemSchema, updateItemSchema, itemCodeSchema } from '../utils/Joi/validationSchemas.js';

const router = express.Router();

// 아이템 생성 API
router.post('/', async (req, res, next) => {
  try {
    const { code, name, stat, price } = await itemSchema.validateAsync(req.body);

    // 아이템 코드 중복 검사
    const isexist = await prisma.item.findFirst({ where: { code: code } });
    if (isexist) {
      const error = new Error('이미 존재하는 아이템 코드입니다.');
      error.status = 400;
      throw error;
    }

    // DB에 아이템 생성
    const item = await prisma.item.create({
      data: {
        code,
        name,
        health: stat?.health || 0,
        power: stat?.power || 0,
        price,
      },
    });

    // 아이템 정보 반환
    return res.status(201).json({ message: '아이템 생성 성공', item: item });
  } catch (error) {
    next(error);
  }
});

// 아이템 수정 API
router.put('/:itemCode', async (req, res, next) => {
  try {
    // 파라미터로 들어온 값 검증
    const { itemCode } = await itemCodeSchema.validateAsync({
      itemCode: req.params.itemCode,
    });

    // body로 들어온 값 검증
    const updateData = await updateItemSchema.validateAsync(req.body);

    // 아이템 검색
    const item = await prisma.item.findFirst({ where: { code: itemCode } });
    if (!item) {
      const error = new Error('아이템을 찾을 수 없습니다.');
      error.status = 404;
      throw error;
    }

    // 아이템 수정
    const updatedItem = await prisma.item.update({
      where: { code: itemCode },
      data: {
        name: updateData.name || item.name,
        health: updateData.stat?.health || item.health,
        power: updateData.stat?.power || item.power,
        // 가격은 수정할 수 없음
      },
    });

    // 반환
    return res.status(200).json({ message: '아이템 수정 성공', item: updatedItem });
  } catch (error) {
    next(error);
  }
});

// 아이템 목록 조회 API
router.get('/', async (req, res, next) => {
  try {
    // 아이템의 코드, 이름, 가격만 조회해서 반환
    const items = await prisma.item.findMany({
      select: { code: true, name: true, price: true },
    });

    return res.status(200).json(items);
  } catch (error) {
    next(error);
  }
});

// 아이템 상세 조회 API
router.get('/:itemCode', async (req, res, next) => {
  try {
    // 파라미터 검증
    const { itemCode } = await itemCodeSchema.validateAsync({
      itemCode: req.params.itemCode,
    });

    // 아이템 검색
    const item = await prisma.item.findFirst({
      where: { code: itemCode },
    });
    if (!item) {
      const error = new Error('아이템을 찾을 수 없습니다.');
      error.status = 404;
      throw error;
    }

    // 검색한 아이템 반환
    const response = {
      code: item.code,
      name: item.name,
      price: item.price,
    };

    return res.status(200).json(response);
  } catch (error) {
    next(error);
  }
});

export default router;
