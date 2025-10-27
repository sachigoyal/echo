import {
  SettleRequest,
  SettleResponse,
  VerifyResponse,
  VerifyRequest,
} from './x402-types';
import { verify as x402Verify, settle as x402Settle } from 'x402/facilitator';
// @ts-ignore - moduleResolution:node doesn't support package exports, but works at runtime
import { createConnectedClient, createSigner, SupportedEVMNetworks, SupportedSVMNetworks, Signer, ConnectedClient } from 'x402/types';

const EVM_PRIVATE_KEY = process.env.EVM_PRIVATE_KEY || '';
const SVM_PRIVATE_KEY = process.env.SVM_PRIVATE_KEY || '';
const SVM_RPC_URL = process.env.SVM_RPC_URL || '';

const x402Config =
  SVM_RPC_URL ? { svmConfig: { rpcUrl: SVM_RPC_URL } } : undefined;

const verify = async (request: VerifyRequest): Promise<VerifyResponse> => {
  const { paymentPayload, paymentRequirements } = request;

  let client: Signer | ConnectedClient;
  if (SupportedEVMNetworks.includes(paymentRequirements.network)) {
    client = createConnectedClient(paymentRequirements.network);
  } else if (SupportedSVMNetworks.includes(paymentRequirements.network)) {
    client = await createSigner(paymentRequirements.network, SVM_PRIVATE_KEY);
  } else {
    return {
      isValid: false,
      invalidReason: 'invalid_network',
    };
  }

  const result = await x402Verify(
    client,
    paymentPayload,
    paymentRequirements,
    x402Config
  );

  return result;
};

const settle = async (request: SettleRequest): Promise<SettleResponse> => {
  const { paymentPayload, paymentRequirements } = request;

  let signer: Signer;
  if (SupportedEVMNetworks.includes(paymentRequirements.network)) {
    signer = await createSigner(paymentRequirements.network, EVM_PRIVATE_KEY);
  } else if (SupportedSVMNetworks.includes(paymentRequirements.network)) {
    signer = await createSigner(paymentRequirements.network, SVM_PRIVATE_KEY);
  } else {
    throw new Error('Invalid network');
  }

  const response = await x402Settle(
    signer,
    paymentPayload,
    paymentRequirements,
    x402Config
  );

  return response;
};

export const localFacilitator = {
  verify,
  settle,
};