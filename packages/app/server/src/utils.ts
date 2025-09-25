import { ExactEvmPayloadAuthorization } from "types";

export function parseX402Headers(headers: Record<string, string>): ExactEvmPayloadAuthorization {
    return {
        from: headers['from'] as `0x${string}`,
        to: headers['to'] as `0x${string}`,
        value: headers['value'] as string,
        valid_after: Number(headers['valid_after'] as string),
        valid_before: Number(headers['valid_before'] as string),
        nonce: headers['nonce'] as `0x${string}`,
    }
}