import { prisma } from '../utils/prisma/prismaClient.js';
import { characterIdSchema } from '../utils/Joi/validationSchemas.js';

export default async function authenticateCharacter(req, res, next) {
  try {
    // 파라미터 검증
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

    // 검증된 캐릭터를 요청 객체에 추가
    req.character = character;
    next();
  } catch (error) {
    next(error);
  }
}
