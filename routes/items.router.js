import express from 'express';
import Joi from 'joi';
import { prisma } from '../utils/prisma/prismaClient.js';

const router = express.Router();

const itemSchema = Joi.object({
  code: Joi.number().integer().required().messages({
    'number.base': '아이템 코드는 숫자여야 합니다.',
    'number.integer': '아이템 코드는 정수형이어야 합니다.',
    'any.required': '아이템 코드를 입력해주세요.',
  }),
  name: Joi.string().required().messages({
    'any.required': '아이템 이름을 입력해주세요.',
  }),
  price: Joi.number().integer().min(0).default(0).messages({
    'number.base': '아이템 가격은 숫자여야 합니다.',
    'number.min': '아이템 가격은 0 이상이어야 합니다.',
  }),
  stat: Joi.object({
    health: Joi.number().integer().default(0).messages({
      'number.base': '체력은 숫자여야 합니다.',
    }),
    power: Joi.number().integer().default(0).messages({
      'number.base': '공격력은 숫자여야 합니다.',
    }),
  }).required(),
});

const itemCodeSchema = Joi.object({
  itemCode: Joi.number().integer().required().messages({
    'number.base': '아이템 코드는 숫자여야 합니다.',
    'number.integer': '아이템 코드는 정수여야 합니다.',
    'any.required': '아이템 코드를 입력해주세요.',
  }),
});

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
        health: stat.healt,
        power: stat.power,
        price,
      },
    });

    // 아이템 정보 반환
    return res.status(201).json({ message: '아이템 생성 성공', item: item });
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
