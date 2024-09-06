import Joi from 'joi';
import jwt from 'jsonwebtoken';

const errorHandler = (err, req, res, next) => {
  if (err instanceof Joi.ValidationError) {
    return res.status(400).json({
      error: err.message,
    });
  }

  // throw된 에러 메시지 반환
  if (err.status) {
    return res.status(err.status).json({
      error: err.message,
    });
  }

  return res.status(500).json({
    error: '예상치 못한 오류',
  });
};

export default errorHandler;
