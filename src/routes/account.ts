import { Router, Request, Response, NextFunction } from 'express';
import { processHeaders } from '../auth/headers';
import { accountManager } from '../accounting/account';

const router = Router();

// Route to increment account balance
router.post('/increment', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const [user, _] = await processHeaders(req.headers as Record<string, string>);
        const { amount } = req.body;

        if (typeof amount !== 'number' || amount <= 0) {
            return res.status(400).json({
                error: 'Amount must be a positive number'
            });
        }

        accountManager.incrementAccount(user, amount);
        res.json({
            success: true,
            newBalance: accountManager.getAccount(user)
        });
    } catch (error) {
        next(error);
    }
});

export default router; 