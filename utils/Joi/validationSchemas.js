import Joi from 'joi';

export const characterIdSchema = Joi.object({
  characterId: Joi.number().integer().required().messages({
    'number.base': '캐릭터 아이디는 숫자여야 합니다.',
    'number.integer': '캐릭터 아이디는 정수여야 합니다.',
    'any.required': '캐릭터 아이디를 입력해주세요.',
  }),
});
