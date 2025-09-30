import { ERC20_CONTRACT_ABI, USDC_ADDRESS } from './services/fund-repo/constants';
import { Abi, encodeFunctionData } from 'viem';
import {
  SendUserOperationReturnType,
} from './types';
import { getSmartAccount } from './utils';
import { Decimal } from 'generated/prisma/runtime/library';

export async function transfer(
  to: string,
  value: Decimal
) : Promise<SendUserOperationReturnType> {

  const { smartAccount } = await getSmartAccount();

  const result = await smartAccount.sendUserOperation({
      network: 'base',
      calls: [
        {
          to: USDC_ADDRESS,
          value: 0n,
          data: encodeFunctionData({
            abi: ERC20_CONTRACT_ABI as Abi,
            functionName: 'transfer',
            args: [to, value.toString()],
          }),
        },
      ],
    }
  )

  return result;
}
