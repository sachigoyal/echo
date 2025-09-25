import { CdpClient } from "@coinbase/cdp-sdk";
import { ERC3009_ABI, USDC_ADDRESS } from "./services/fund-repo/constants";
import { encodeFunctionData } from "viem/_types/utils/abi/encodeFunctionData";
import { serializeTransaction } from "viem/_types/utils/transaction/serializeTransaction";
import { WALLET_OWNER, WALLET_SMART_ACCOUNT, DOMAIN_NAME, DOMAIN_VERSION, DOMAIN_CHAIN_ID, TRANSFER_WITH_AUTHORIZATION_TYPE, TRANSFER_WITH_AUTHORIZATION_NAME } from "./constants";
import { Network, TransferWithAuthorization } from "types";
import { Abi } from "viem";

export async function signTransferWithAuthorization(
    transfer: TransferWithAuthorization,
) {
    const cdp = new CdpClient();
    const owner = await cdp.evm.getOrCreateAccount({
        name: WALLET_OWNER,
    });

    const smartAccount = await cdp.evm.getOrCreateSmartAccount({
        name: WALLET_SMART_ACCOUNT,
        owner,
    });

    const domain = {
        name: DOMAIN_NAME,
        version: DOMAIN_VERSION,
        chainId: DOMAIN_CHAIN_ID,
        verifyingContract: USDC_ADDRESS,
    }

    const message = {
        from: smartAccount.address,
        to: transfer.to,
        value: transfer.value,
        validAfter: transfer.validAfter,
        validBefore: transfer.validBefore,
        nonce: transfer.nonce,
    }

    const authoriztionSignature = await cdp.evm.signTypedData({
        address: smartAccount.address,
        domain,
        types: TRANSFER_WITH_AUTHORIZATION_TYPE,
        primaryType: TRANSFER_WITH_AUTHORIZATION_NAME,
        message,
    })

    const data = encodeFunctionData({
        abi: ERC3009_ABI,
        functionName: 'transferWithAuthorization',
        args: [smartAccount.address, transfer.to, transfer.value, transfer.validAfter, transfer.validBefore, transfer.nonce, authoriztionSignature.signature],
    })

    return await cdp.evm.signTransaction({
        address: smartAccount.address,
        transaction: serializeTransaction({
            to: USDC_ADDRESS,
            data,
            value: 0n,
        }),
    })
}

export async function transferWithAuthorization(
  transfer: TransferWithAuthorization,
) {
  const signature = await signTransferWithAuthorization(transfer);

  const cdp = new CdpClient();
  const owner = await cdp.evm.getOrCreateAccount({
    name: WALLET_OWNER,
  });
  const smartAccount = await cdp.evm.getOrCreateSmartAccount({
    name: WALLET_SMART_ACCOUNT,
    owner,
  });

  return await cdp.evm.sendUserOperation({
    smartAccount,
    network: Network.BASE,
    calls: [
        {
        to: USDC_ADDRESS as `0x${string}`,
        value: 0n,
        data: encodeFunctionData({
            abi: ERC3009_ABI as Abi,
            functionName: 'transferWithAuthorization',
            args: [smartAccount.address, transfer.to, transfer.value, transfer.validAfter, transfer.validBefore, transfer.nonce, signature.signature],
        }),
        },
    ],
  });
}