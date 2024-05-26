import { HttpServer, INestApplication } from '@nestjs/common';
// import type { Server as CoreHttpServer } from 'http';
// import type { Server as CoreHttpsServer } from 'https';
import { Hono, HonoRequest } from 'hono';

/**
 * @publicApi
 */
export interface NestHonoApplication<TServer extends Hono = Hono>
    extends INestApplication<TServer> {
    /**
     * Starts the application.
     *
     * @param {number|string} port
     * @param {string} [hostname]
     * @param {Function} [callback] Optional callback
     * @returns {Promise} A Promise that, when resolved, is a reference to the underlying HttpServer.
     */
    listen(port: number | string, callback?: () => void): Promise<TServer>

    listen(
        port: number | string,
        hostname: string,
        callback?: () => void,
    ): Promise<TServer>

    /**
     * Returns the underlying HTTP adapter bounded to a Hono app.
     *
     * @returns {HttpServer}
     */
    getHttpAdapter(): HttpServer<HonoRequest, Response, Hono>

    /**
     * Register Fastify body parsers on the fly. Will respect
     * the application's `rawBody` option.
     *
     * @example
     * const app = await NestFactory.create<NestFastifyApplication>(
     *   AppModule,
     *   new FastifyAdapter(),
     *   { rawBody: true }
     * );
     * // enable the json parser with a parser limit of 50mb
     * app.useBodyParser('application/json', { bodyLimit: 50 * 1000 * 1024 });
     *
     * @returns {this}
     */
    // useBodyParser<TServer extends RawServerBase = RawServerBase>(
    //     type: string | string[] | RegExp,
    //     options?: NestFastifyBodyParserOptions,
    //     parser?: FastifyBodyParser<Buffer, TServer>,
    // ): this;

    /**
     * Sets a base directory for public assets.
     * Example `app.useStaticAssets({ root: 'public' })`
     * @returns {this}
     */
    useStaticAssets(options: HonoStaticOptions): this

    /**
     * Sets a view engine for templates (views).
     * @example
     * app.setViewEngine('jsx')
     *
     * @returns {this}
     */
    setViewEngine(engine: "jsx"): this
}

type HonoStaticOptions = any
