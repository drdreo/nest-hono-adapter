# Hono Adapter for NestJs

https://hono.dev

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

## Ideas From:

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
