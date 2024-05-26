// aka https://github.com/nestjs/nest/blob/master/packages/platform-fastify/adapters/fastify-adapter.ts
import * as http from "node:http";
import * as https from "node:https";
import { HttpStatus, Logger, NestApplicationOptions, RequestMethod, VersioningOptions } from "@nestjs/common";
import { AbstractHttpAdapter } from "@nestjs/core/adapters/http-adapter";
import { Context as HonoContext, Hono } from "hono";
import { VersionValue } from "@nestjs/common/interfaces";
import type { HttpBindings } from "@hono/node-server";
import { createAdaptorServer } from "@hono/node-server";
import { Server } from "node:net";
import { Http2SecureServer, Http2Server } from "node:http2";
import type { RedirectStatusCode, StatusCode } from "hono/utils/http-status";
import { RESPONSE_ALREADY_SENT } from "@hono/node-server/utils/response";
import { cors } from "hono/cors";

type ServerType = Server | Http2Server | Http2SecureServer;

/**
 * @publicApi
 */
export class HonoAdapter extends AbstractHttpAdapter<ServerType> {
    private readonly logger = new Logger(HonoAdapter.name);

    constructor(instance?: Hono) {
        super(instance || new Hono<{ Bindings: HttpBindings }>());
        this.logger.debug("constructor");
    }

    public getRequestHostname(ctx: HonoContext): string {
        this.logger.debug("getRequestHostname");
        return ctx.req.header().host;
    }

    public getRequestMethod(ctx: HonoContext): string {
        this.logger.debug("getRequestMethod");
        return ctx.req.method;
    }

    public getRequestUrl(ctx: HonoContext): string {
        this.logger.debug("getRequestUrl");
        return ctx.req.url;
    }

    public listen(port: string | number, callback?: () => void): ServerType;
    public listen(port: string | number, hostname: string, callback?: () => void): ServerType;
    public listen(port: any, ...args: any[]): ServerType {
        this.logger.debug("listening on port: " + port);
        return this.httpServer.listen(port, ...args);
        // return serve({
        //     fetch: this.instance.fetch,
        //     port,
        //     overrideGlobalObjects: false,
        // })
    }

    public close() {
        this.logger.debug("Closing server");
        if (!this.httpServer) {
            return Promise.resolve();
        }
        this.instance.close();
        return new Promise((resolve, reject) => {
            this.httpServer.close((err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(undefined);
                }
            });
        });
    }

    initHttpServer(options: NestApplicationOptions) {
        this.logger.debug("initHttpServer");
        const isHttpsEnabled = options?.httpsOptions;
        const createServer = isHttpsEnabled ? https.createServer : http.createServer;

        this.httpServer = createAdaptorServer({
            fetch: this.instance.fetch,
            createServer,
            overrideGlobalObjects: false,
        });
    }

    useStaticAssets(...args: any[]) {
        throw new Error("Method not implemented.");
    }

    setViewEngine(engine: string) {
        throw new Error("Method not implemented.");
    }

    status(response: any, statusCode: StatusCode) {
        this.logger.debug("status: " + statusCode);

        // TODO: correctly call hono status
        return;
    }

    reply(ctx: any, body: any, statusCode: StatusCode | undefined) {
        this.logger.debug("reply: " + statusCode);
        // This connection is the culprit
        if (statusCode) {
            ctx.status(statusCode);
        }

        // if (body instanceof StreamableFile) {
        //     const streamHeaders = body.getHeaders();
        //     if (
        //       response.getHeader("Content-Type") === undefined &&
        //       streamHeaders.type !== undefined
        //     ) {
        //         response.setHeader("Content-Type", streamHeaders.type);
        //     }
        //     if (
        //       response.getHeader("Content-Disposition") === undefined &&
        //       streamHeaders.disposition !== undefined
        //     ) {
        //         response.setHeader(
        //           "Content-Disposition",
        //           streamHeaders.disposition,
        //         );
        //     }
        //     if (
        //       response.getHeader("Content-Length") === undefined &&
        //       streamHeaders.length !== undefined
        //     ) {
        //         response.setHeader("Content-Length", streamHeaders.length);
        //     }
        //     return pipeline(
        //       body.getStream().once("error", (err: Error) => {
        //           body.errorHandler(err, response);
        //       }),
        //       response,
        //       // @ts-ignore
        //       (err: Error) => {
        //           if (err) {
        //               body.errorLogger(err);
        //           }
        //       },
        //     );
        // }
        const responseContentType = this.getHeader(ctx, "Content-Type");
        if (!responseContentType?.startsWith("application/json") && body?.statusCode >= HttpStatus.BAD_REQUEST) {
            this.logger.warn(
                "Content-Type doesn't match Reply body, you might need a custom ExceptionFilter for non-JSON responses",
            );
            ctx.res.setHeader("Content-Type", "application/json");
        }
        return ctx.body(body);
    }

    public async createMiddlewareFactory(requestMethod: RequestMethod): Promise<any> {
        // if (!this.isMiddieRegistered) {
        //     await this.registerMiddie();
        // }
        // return (path: string, callback: Function) => {
        //     const hasEndOfStringCharacter = path.endsWith('$');
        //     path = hasEndOfStringCharacter ? path.slice(0, -1) : path;
        //
        //     let normalizedPath = path.endsWith('/*')
        //         ? `${path.slice(0, -1)}(.*)`
        //         : path;
        //
        //     // Fallback to "(.*)" to support plugins like GraphQL
        //     normalizedPath = normalizedPath === '/(.*)' ? '(.*)' : normalizedPath;
        //
        //     let re = pathToRegexp(normalizedPath);
        //     re = hasEndOfStringCharacter ? new RegExp(re.source + '$', re.flags) : re;
        //
        //     // The following type assertion is valid as we use import('@fastify/middie') rather than require('@fastify/middie')
        //     // ref https://github.com/fastify/middie/pull/55
        //     this.instance.use(
        //         normalizedPath,
        //         (req: any, res: any, next: Function) => {
        //             const queryParamsIndex = req.originalUrl.indexOf('?');
        //             const pathname =
        //                 queryParamsIndex >= 0
        //                     ? req.originalUrl.slice(0, queryParamsIndex)
        //                     : req.originalUrl;
        //
        //             if (!re.exec(pathname + '/') && normalizedPath) {
        //                 return next();
        //             }
        //             return callback(req, res, next);
        //         },
        //     );
        // };

        this.logger.error("createMiddlewareFactory not implemented");
        return "NOT IMPLEMENTED";
    }

    applyVersionFilter(handler: Function, version: VersionValue, versioningOptions: VersioningOptions): any {
        this.logger.error("applyVersionFilter not implemented");
    }

    public async end(ctx: HonoContext, message?: string) {
        // this.logger.debug("end: " + message)
        //
        // if (!ctx?.env) {
        //     return
        // }
        // const { outgoing } = ctx.env
        // if (!outgoing) {
        //     return
        // }
        // outgoing.end(message)

        return RESPONSE_ALREADY_SENT;
    }

    render(ctx: HonoContext, view: string, options: any) {
        return ctx.render(view); // TODO
    }

    redirect(ctx: HonoContext, statusCode: RedirectStatusCode, url: string) {
        this.logger.debug("redirect: " + url + " " + statusCode);
        return ctx.redirect(url, statusCode);
    }

    setErrorHandler(handler: Function, prefix?: string | undefined) {
        this.logger.debug("setting error handler");
        this.instance.onError((err: Error, ctx: HonoContext) => {
            console.error(`${err}`);
            handler(ctx, err);
            return ctx.text(err.message, 500);
        });
    }

    setNotFoundHandler(handler: Function, prefix?: string | undefined) {
        this.logger.debug("setting not found handler");
        this.instance.notFound((ctx: HonoContext) => {
            console.error(`Not found: ${ctx.req.path}`);
            handler(ctx);
            return ctx.json({ message: "Not found", statusCode: 404 }, 404);
        });
    }

    isHeadersSent(response: HonoContext) {
        this.logger.debug("isHeadersSent");
        return true; // TODO
    }

    getHeader(response: Response, name: string) {
        return response.headers.get(name);
    }

    setHeader(response: Response, name: string, value: string) {
        this.logger.debug("setting header: " + name + " " + value);
        return response.headers.set(name, value);
    }

    appendHeader(response: Response, name: string, value: string) {
        return response.headers.append(name, value);
    }

    registerParserMiddleware(prefix?: string | undefined, rawBody?: boolean | undefined) {
        this.logger.verbose("skipping registerParserMiddleware");
        // const bodyParserJsonOptions = getBodyParserOptions(!!rawBody);
        // const bodyParserUrlencodedOptions = getBodyParserOptions(!!rawBody, {
        //     extended: true,
        // });
        //
        // const parserMiddleware = {
        //     jsonParser: bodyParserJson(bodyParserJsonOptions),
        //     urlencodedParser: bodyParserUrlencoded(bodyParserUrlencodedOptions),
        // };
        // Object.keys(parserMiddleware)
        //     .forEach(parserKey => this.use(parserMiddleware[parserKey]));
    }

    enableCors(options: any, prefix?: string | undefined) {
        this.logger.debug("enableCors");
        return this.use(cors(options));
    }

    getType(): string {
        return "hono";
    }
}
