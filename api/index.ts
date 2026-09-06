import { createExpressServer } from '../src/server';
import { setupBotHandlers } from '../src/bot';

setupBotHandlers();
const app = createExpressServer();

export default app;
