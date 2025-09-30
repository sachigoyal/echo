import { ERC3009_ABI, USDC_ADDRESS } from './services/fund-repo/constants';
import { encodeFunctionData } from 'viem';
import {
  DOMAIN_NAME,
  DOMAIN_VERSION,
  DOMAIN_CHAIN_ID,
  TRANSFER_WITH_AUTHORIZATION_TYPE,
  TRANSFER_WITH_AUTHORIZATION_NAME,
} from './constants';
import {
  Network,
  TransferWithAuthorization,
} from 'types';
import { getSmartAccount } from 'utils';

export async function signTransferWithAuthorization(
  transfer: TransferWithAuthorization
) {
  const { smartAccount } = await getSmartAccount();

  const domain = {
    name: DOMAIN_NAME,
    version: DOMAIN_VERSION,
    chainId: DOMAIN_CHAIN_ID,
    verifyingContract: USDC_ADDRESS,
  };

  const message = {
    from: smartAccount.address,
    to: transfer.to,
    value: transfer.value,
    validAfter: transfer.valid_after,
    validBefore: transfer.valid_before,
    nonce: transfer.nonce,
  };

  const signature = await smartAccount.signTypedData({
    domain,
    types: TRANSFER_WITH_AUTHORIZATION_TYPE,
    primaryType: TRANSFER_WITH_AUTHORIZATION_NAME,
    message,
    network: Network.BASE,
  });

  return signature;
}

export async function settleWithAuthorization(
  transfer: TransferWithAuthorization
) {
  const { smartAccount } = await getSmartAccount();

  const signature = await signTransferWithAuthorization(transfer);
  const network = process.env.NETWORK as Network;

  const result = await smartAccount.sendUserOperation({
    network,
    calls: [
      {
        to: USDC_ADDRESS,
        value: 0n,
        data: encodeFunctionData({
          abi: ERC3009_ABI,
          functionName: 'transferWithAuthorization',
          args: [
            smartAccount.address,
            transfer.to as `0x${string}`,
            BigInt(transfer.value),
            BigInt(transfer.valid_after),
            BigInt(transfer.valid_before),
            transfer.nonce as `0x${string}`,
            signature,
          ],
        }),
      },
    ],
  });

  return result;
}
