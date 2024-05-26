# Hono Adapter for NestJs

https://hono.dev

<img src="https://img.itch.zone/aW1nLzY1ODIzMjcucG5n/315x250%23c/vBpQ2S.png" width="60">

https://docs.nestjs.com/techniques/performance#adapter

## Goal

The goal is to have a simple application adapter as we have for express and fastify. E.g.:

```ts
const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
await app.listen(3000);
```

and the ideal equivalent:

```ts
const app = await NestFactory.create<NestHonoApplication>(AppModule, new HonoAdapter());
await app.listen(3000);
```

## Ideas From

Officially, NestJS is not working on a Hono integration:

https://github.com/nestjs/nest/issues/13013

https://github.com/nestjs/nest/issues/13073#issuecomment-1902730322

## Notes

### Testing

A test-app exists in `test-app/nest-app` which can be debugged and ran via:

```bash
npm run start:debug
```

To make it easier to compare behavior with the express adapter, its commented out in the `main.ts` but can simply be
swapped in.

### Problems

For some reason, the response / ctx is not correctly propagated when calling the adapter methods.
Instead, an async function is passed around, e.g. to the `reply()`. Seems to be something like the next() handler
function.

`getRequestHostname` and co. seem to get the correct HonoContext.
