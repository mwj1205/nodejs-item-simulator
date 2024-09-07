import express from 'express';
import usersRouter from './routes/users.router.js';
import charactersRouter from './routes/characters.router.js';
import LogMiddleware from './middlewares/log.middleware.js';
import ErrorHandlerMiddleware from './middlewares/error-handler.middleware.js';

const app = express();
const PORT = 3000;

app.use(express.json());

app.use(LogMiddleware);
app.use('/api/users', usersRouter);
app.use('/api/characters', charactersRouter);

app.use(ErrorHandlerMiddleware);

app.listen(PORT, () => {
  console.log(PORT, '포트로 서버가 열렸어요!');
});
