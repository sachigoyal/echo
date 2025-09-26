import { CdpClient } from "@coinbase/cdp-sdk";
import { ERC3009_ABI, USDC_ADDRESS } from "./services/fund-repo/constants";
import { encodeFunctionData } from "viem/_types/utils/abi/encodeFunctionData";
import { serializeTransaction } from "viem/_types/utils/transaction/serializeTransaction";
import { WALLET_OWNER, WALLET_SMART_ACCOUNT, DOMAIN_NAME, DOMAIN_VERSION, DOMAIN_CHAIN_ID, TRANSFER_WITH_AUTHORIZATION_TYPE, TRANSFER_WITH_AUTHORIZATION_NAME } from "./constants";
import { Network, Schema, SettleRequest, TransferWithAuthorization, X402Version } from "types";
import { FacilitatorClient } from "facilitatorClient";

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
        validAfter: transfer.valid_after,
        validBefore: transfer.valid_before,
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
        args: [smartAccount.address, transfer.to as `0x${string}`, transfer.value, transfer.valid_after as bigint, transfer.valid_before as bigint, transfer.nonce as `0x${string}`, authoriztionSignature.signature],
    })

    return await cdp.evm.signTransaction({
        address: smartAccount.address,
        transaction: serializeTransaction({
            to: USDC_ADDRESS,
            data,
            value: 0n,
        }),
    }).then(tx => tx.signature);
}

export async function settleWithAuthorization(
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

  const signature = await signTransferWithAuthorization(transfer);

  const settleRequest: SettleRequest = {
    x402_version: X402Version.V1,
    payment_payload: {
      x402_version: X402Version.V1,
      schema: Schema.Exact,
      network: Network.BASE,
      payload: {
        signature: signature,
        authorization: {
          from: smartAccount.address,
          to: transfer.to,
          value: transfer.value,
          valid_after: transfer.valid_after,
          valid_before: transfer.valid_before,
          nonce: transfer.nonce,
        },
      },
    },
    payment_requirements: {
      schema: Schema.Exact,
      network: Network.BASE,
      max_amount_required: transfer.value,
      resource: transfer.to,
      description: 'Transfer with Authorization',
      mime_type: 'application/json',
      pay_to: smartAccount.address,
      max_timeout_seconds: 1000,
      asset: USDC_ADDRESS,
    },
  }

  const facilitator = new FacilitatorClient(process.env.FACILITATOR_BASE_URL!);
  return await facilitator.settle(settleRequest);
}

export async function decodeSignature(signature: string) {
}