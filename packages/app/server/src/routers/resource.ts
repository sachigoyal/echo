import { Request, Response, Router } from 'express';
import { tavilySearchRoute } from '../resources/tavily/route';
import { e2bExecuteRoute } from '../resources/e2b/route';

const resourceRouter: Router = Router();

resourceRouter.post('/tavily/search', async (req: Request, res: Response) => {
  return await tavilySearchRoute(req, res);
});

resourceRouter.post('/e2b/execute', async (req: Request, res: Response) => {
  return await e2bExecuteRoute(req, res);
});

export default resourceRouter;
