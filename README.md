![Echo Header](./imgs/header_gif.gif)

Monetize AI Apps in Minutes

Charge usage-based billing for your product to start generating revenue risk-free. You set the markup, we handle the rest.

[Read the docs](https://echo.merit.systems/docs) to get started.

## Core

- [Echo Control](./echo-control): Next.js app for [echo.merit.systems](https://echo.merit.systems). Hosted site and api routes.
- [Echo Server](./echo-server): Express server for router.echo.merit.systems. Proxy for routing and metering LLM requests from clients.

## SDKs

- [Echo TS SDK](./echo-typescript-sdk) Typescript SDK that all the framework specific SDKs are built on top of.
- [Echo Next.js SDK](./echo-next-sdk) SDK for simple Next.js 15+ App Router integration.
- [Echo React SDK](./echo-react-sdk) SDK for simple React client side SPA integration.


## Examples

- [Echo Next.js Example](./examples/next-sdk-example)
- [Echo React SDK](./examples/vite)

# Development
Fill out `echo-control/.env` and `echo-server/.env`. Then...
- `pnpm i`
- `pnpm dev`