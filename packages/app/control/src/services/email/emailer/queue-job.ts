import { qstashClient } from "@/lib/qstash"
import { EmailJobPayload } from "./types"

const ECHO_CONTROL_APP_BASE_URL = process.env.ECHO_CONTROL_APP_BASE_URL || 'http://localhost:3000'

const RESEND_FLOW_CONTROL_KEY = process.env.RESEND_FLOW_CONTROL_KEY || 'resend-flow-control-key'

export async function queueJob(body: EmailJobPayload) {
  await qstashClient.publishJSON({
    url: `${ ECHO_CONTROL_APP_BASE_URL }/api/jobs`,
    body,
    flowControl: {
      key: RESEND_FLOW_CONTROL_KEY,
      rate: 2,
      period: '1m',
    }
  })
}