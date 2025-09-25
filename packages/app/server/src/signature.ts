import { CdpClient } from "@coinbase/cdp-sdk";
import { ERC3009_ABI, USDC_ADDRESS } from "./services/fund-repo/constants";
import { encodeFunctionData } from "viem/_types/utils/abi/encodeFunctionData";
import { serializeTransaction } from "viem/_types/utils/transaction/serializeTransaction";
import { WALLET_OWNER, WALLET_SMART_ACCOUNT, DOMAIN_NAME, DOMAIN_VERSION, DOMAIN_CHAIN_ID, TRANSFER_WITH_AUTHORIZATION_TYPE, TRANSFER_WITH_AUTHORIZATION_NAME } from "./constants";

export async function signTransferWithAuthorization(
  to: `0x${string}`,
  value: bigint,
  validAfter: bigint,
  validBefore: bigint,
  nonce: `0x${string}`,
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
        to,
        value,
        validAfter,
        validBefore,
        nonce,
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