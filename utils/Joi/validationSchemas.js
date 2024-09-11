import Joi from 'joi';

export const userSchema = Joi.object({
  username: Joi.string()
    .pattern(/^[a-z0-9]+$/)
    .min(3)
    .max(30)
    .required()
    .messages({
      'string.pattern.base': '아이디는 소문자와 숫자만 포함되어야 합니다.',
      'string.min': '아이디는 3글자 이상이어야 합니다.',
      'string.max': '아이디는 30글자를 넘을 수 없습니다.',
      'any.required': '아이디를 입력해주세요.',
    }),
  password: Joi.string().min(6).required().messages({
    'string.min': '비밀번호는 6글자 이상이어야 합니다.',
    'any.required': '비밀번호를 입력해주세요.',
  }),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
    'any.only': '비밀번호가 일치하지 않습니다.',
    'any.required': '비밀번호 확인을 입력해주세요.',
  }),
  name: Joi.string().required().messages({
    'any.required': '닉네임을 입력해주세요.',
  }),
});

export const loginSchema = Joi.object({
  username: Joi.string().required().messages({
    'any.required': '아이디를 입력해주세요.',
  }),
  password: Joi.string().required().messages({
    'any.required': '비밀번호를 입력해주세요.',
  }),
});

export const characterIdSchema = Joi.object({
  characterId: Joi.number().integer().required().messages({
    'number.base': '캐릭터 아이디는 숫자여야 합니다.',
    'number.integer': '캐릭터 아이디는 정수여야 합니다.',
    'any.required': '캐릭터 아이디를 입력해주세요.',
  }),
});

export const characterSchema = Joi.object({
  name: Joi.string().min(2).max(12).required().messages({
    'string.min': '캐릭터명은 2글자 이상이어야 합니다.',
    'string.max': '캐릭터명은 12글자를 넘을 수 없습니다.',
    'any.required': '캐릭터명을 입력해주세요.',
  }),
});

export const itemSchema = Joi.object({
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
  }),
});

export const updateItemSchema = Joi.object({
  name: Joi.string(),
  stat: Joi.object({
    health: Joi.number().integer().messages({
      'number.base': '체력은 숫자여야 합니다.',
    }),
    power: Joi.number().integer().messages({
      'number.base': '공격력은 숫자여야 합니다.',
    }),
  }),
}).min(1); // 최소 하나의 필드

export const itemCodeSchema = Joi.object({
  itemCode: Joi.number().integer().required().messages({
    'number.base': '아이템 코드는 숫자여야 합니다.',
    'number.integer': '아이템 코드는 정수여야 합니다.',
    'any.required': '아이템 코드를 입력해주세요.',
  }),
});

export const itemPurchaseSaleSchema = Joi.array()
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
    'array.min': '적어도 하나의 아이템을 입력해야 합니다.',
  });

export const itemCodeEquipSchema = Joi.object({
  code: Joi.number().integer().required().messages({
    'number.base': '아이템 코드는 숫자여야 합니다.',
    'number.integer': '아이템 코드는 정수여야 합니다.',
    'any.required': '아이템 코드를 입력해주세요.',
  }),
});
