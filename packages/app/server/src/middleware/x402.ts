import { NextFunction, Response } from "express";
import { USDC_ADDRESS } from "services/fund-repo/constants";
import { Network } from "types";
import { getSmartAccount } from "utils";
import { paymentMiddleware } from "x402-express";
import { facilitator } from "@coinbase/x402";
import { EscrowRequest } from "./transaction-escrow-middleware";

export function x402DynamicPricingMiddleware() {
    return async (req: EscrowRequest, res: Response, next: NextFunction) => {
        const amount = 111 // TODO: from alvaro
        const network = process.env.NETWORK as Network;
        const recipient = (await getSmartAccount()).smartAccount.address;

        const routes = {
            [`${req.method.toUpperCase()} ${req.path}`]: {
                price: {
                    amount,
                    asset: {
                        address: USDC_ADDRESS,
                        decimals: 6,
                        eip712: { name: 'USD Coin', version: '2'}
                    },
                },
                network,
                config: {
                    description: 'Echo x402',
                    mimeType: 'application/json',
                    maxTimeoutSeconds: 1000,
                    discoverable: true,
                }
            }
        }

        return paymentMiddleware(
            recipient,
            routes,
            facilitator,
        )
    };
}