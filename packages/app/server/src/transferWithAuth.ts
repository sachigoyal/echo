import { ERC20_CONTRACT_ABI, USDC_ADDRESS } from './services/fund-repo/constants';
import { Abi, encodeFunctionData } from 'viem';
import {
  TransferWithAuthorization,
  SendUserOperationReturnType,
} from './types';
import { getSmartAccount } from './utils';

export async function transferWithAuthorization(
  transfer: TransferWithAuthorization
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
            args: [transfer.to, transfer.value],
          }),
        },
      ],
    }
  )

  return result;
}
