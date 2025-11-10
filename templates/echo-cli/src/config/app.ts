import { ECHO_APP_ID, WALLETCONNECT_PROJECT_ID } from '@/constants'

const ECHO_URL = 'https://echo.merit.systems'
const ECHO_API_URL = 'https://api.echo.merit.systems/v1'
const ECHO_ROUTER_URL = 'https://echo.router.merit.systems'

export const APP = {
  name: 'Echodex',
  description: 'CLI Coding Agent Powered by Echo',
  version: '1.0.0',
  echoAppId: ECHO_APP_ID,
  walletConnectProjectId: WALLETCONNECT_PROJECT_ID,
  echoKeysUrl: `${ECHO_URL}/app/${ECHO_APP_ID}/keys`,
  echoUrl: ECHO_URL,
  echoApiUrl: ECHO_API_URL,
  echoRouterUrl: ECHO_ROUTER_URL
} as const

export const APP_METADATA = {
  name: APP.name,
  description: APP.description,
  url: APP.echoUrl,
  icons: [`${APP.echoUrl}/favicon.ico`]
}
