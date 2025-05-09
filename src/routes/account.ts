import { Router, Request, Response, NextFunction } from 'express';
import { accountManager } from '../accounting/account';
import { verifyUserHeaderCheck } from '../auth/headers';
const router = Router();

// Route to increment account balance
router.post('/increment', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const [user, _] = await verifyUserHeaderCheck(req.headers as Record<string, string>);
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