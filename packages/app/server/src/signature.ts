import { CdpClient } from "@coinbase/cdp-sdk";
import { ERC3009_ABI, USDC_ADDRESS } from "./services/fund-repo/constants";
import { encodeFunctionData } from "viem/_types/utils/abi/encodeFunctionData";
import { serializeTransaction } from "viem/_types/utils/transaction/serializeTransaction";

export async function signTransferWithAuthorization(
  to: `0x${string}`,
  value: bigint,
  validAfter: bigint,
  validBefore: bigint,
  nonce: `0x${string}`,
) {
    const cdp = new CdpClient();
    const owner = await cdp.evm.getOrCreateAccount({
    name: 'echo-fund-owner',
    });

    const smartAccount = await cdp.evm.getOrCreateSmartAccount({
        name: 'echo-fund-smart-account',
        owner,
    });

    const domain = {
        name: 'USD Coin',
        version: '2',
        chainId: 8453,
        verifyingContract: USDC_ADDRESS,
    }

    const types = {
        TransferWithAuthorization: [
            { name: 'from', type: 'address' },
            { name: 'to', type: 'address' },
            { name: 'value', type: 'uint256' },
            { name: 'validAfter', type: 'uint256' },
            { name: 'validBefore', type: 'uint256' },
            { name: 'nonce', type: 'uint256' },
        ]
    };

    const message = {
        from: smartAccount.address,
        to,
        value,
        validAfter,
        validBefore,
        nonce,
    }

    const authoriztionSignature = await cdp.evm.signTypedData({
        address: smartAccount.address,
        domain,
        types,
        primaryType: 'TransferWithAuthorization',
        message,
    })

    const data = encodeFunctionData({
        abi: ERC3009_ABI,
        functionName: 'transferWithAuthorization',
        args: [smartAccount.address, to, value, validAfter, validBefore, nonce, authoriztionSignature.signature],
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