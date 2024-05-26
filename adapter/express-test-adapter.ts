import type { Server } from "http"
import * as http from "http"
import {
    HttpStatus,
    InternalServerErrorException,
    Logger,
    RequestMethod,
    StreamableFile,
    VERSION_NEUTRAL,
    VersioningOptions,
    VersioningType,
} from "@nestjs/common"
import { VersionValue } from "@nestjs/common/interfaces"
import {
    CorsOptions,
    CorsOptionsDelegate,
} from "@nestjs/common/interfaces/external/cors-options.interface"
import { NestApplicationOptions } from "@nestjs/common/interfaces/nest-application-options.interface"
import {
    isFunction,
    isNil,
    isObject,
    isString,
    isUndefined,
} from "@nestjs/common/utils/shared.utils"
import { AbstractHttpAdapter } from "@nestjs/core/adapters/http-adapter"
import { RouterMethodFactory } from "@nestjs/core/helpers/router-method-factory"
import * as bodyparser from "body-parser"
import {
    json as bodyParserJson,
    urlencoded as bodyParserUrlencoded,
} from "body-parser"
import * as cors from "cors"
import * as express from "express"
import * as https from "https"
import { Duplex, pipeline } from "stream"
import { getBodyParserOptions } from "./hono.utils"
import { ServeStaticOptions } from "../interfaces/serve-static-options.options"

type VersionedRoute = <
    TRequest extends Record<string, any> = any,
    TResponse = any,
>(
    req: TRequest,
    res: TResponse,
    next: () => void,
) => any

/**
 * @publicApi
 */
export class ExpressTestAdapter extends AbstractHttpAdapter<
    http.Server | https.Server
> {
    private readonly routerMethodFactory = new RouterMethodFactory()
    private readonly logger = new Logger(ExpressTestAdapter.name)
    private readonly openConnections = new Set<Duplex>()

    constructor(instance?: any) {
        super(instance || express())
        this.logger.debug("constructor")
    }

    public reply(response: any, body: any, statusCode?: number) {
        this.logger.debug("reply: " + statusCode)

        if (statusCode) {
            response.status(statusCode)
        }
        if (isNil(body)) {
            return response.send()
        }
        if (body instanceof StreamableFile) {
            const streamHeaders = body.getHeaders()
            if (
                response.getHeader("Content-Type") === undefined &&
                streamHeaders.type !== undefined
            ) {
                response.setHeader("Content-Type", streamHeaders.type)
            }
            if (
                response.getHeader("Content-Disposition") === undefined &&
                streamHeaders.disposition !== undefined
            ) {
                response.setHeader(
                    "Content-Disposition",
                    streamHeaders.disposition,
                )
            }
            if (
                response.getHeader("Content-Length") === undefined &&
                streamHeaders.length !== undefined
            ) {
                response.setHeader("Content-Length", streamHeaders.length)
            }
            return pipeline(
                body.getStream().once("error", (err: Error) => {
                    body.errorHandler(err, response)
                }),
                response,
                // @ts-ignore
                (err: Error) => {
                    if (err) {
                        body.errorLogger(err)
                    }
                },
            )
        }
        const responseContentType = response.getHeader("Content-Type")
        if (
            typeof responseContentType === "string" &&
            !responseContentType.startsWith("application/json") &&
            body?.statusCode >= HttpStatus.BAD_REQUEST
        ) {
            this.logger.warn(
                "Content-Type doesn't match Reply body, you might need a custom ExceptionFilter for non-JSON responses",
            )
            response.setHeader("Content-Type", "application/json")
        }
        return isObject(body)
            ? response.json(body)
            : response.send(String(body))
    }

    public status(response: any, statusCode: number) {
        this.logger.debug("status: " + statusCode)
        return response.status(statusCode)
    }

    public end(response: any, message?: string) {
        this.logger.debug("end")
        return response.end(message)
    }

    public render(response: any, view: string, options: any) {
        this.logger.debug("render")
        return response.render(view, options)
    }

    public redirect(response: any, statusCode: number, url: string) {
        this.logger.debug("redirect")
        return response.redirect(statusCode, url)
    }

    public setErrorHandler(handler: Function, prefix?: string) {
        this.logger.debug("setErrorHandler")
        return this.use(handler)
    }

    public setNotFoundHandler(handler: Function, prefix?: string) {
        this.logger.debug("setNotFoundHandler")
        return this.use(handler)
    }

    public isHeadersSent(response: any): boolean {
        this.logger.debug("isHeadersSent")
        return response.headersSent
    }

    public getHeader(response: any, name: string) {
        this.logger.debug("getHeader")
        return response.get(name)
    }

    public setHeader(response: any, name: string, value: string) {
        this.logger.debug("setHeader")
        return response.set(name, value)
    }

    public appendHeader(response: any, name: string, value: string) {
        this.logger.debug("appendHeader")
        return response.append(name, value)
    }

    public listen(port: string | number, callback?: () => void): Server
    public listen(
        port: string | number,
        hostname: string,
        callback?: () => void,
    ): Server
    public listen(port: any, ...args: any[]): Server {
        this.logger.debug("listening on port: " + port)

        return this.httpServer.listen(port, ...args)
    }

    public close() {
        this.logger.debug("closing")

        this.closeOpenConnections()

        if (!this.httpServer) {
            return undefined
        }
        return new Promise((resolve) => this.httpServer.close(resolve))
    }

    public set(...args: any[]) {
        this.logger.debug("set")
        return this.instance.set(...args)
    }

    public enable(...args: any[]) {
        this.logger.debug("enable")
        return this.instance.enable(...args)
    }

    public disable(...args: any[]) {
        this.logger.debug("disable")
        return this.instance.disable(...args)
    }

    public engine(...args: any[]) {
        this.logger.debug("engine")
        return this.instance.engine(...args)
    }

    public useStaticAssets(path: string, options: ServeStaticOptions) {
        this.logger.debug("useStaticAssets")

        if (options && options.prefix) {
            return this.use(options.prefix, express.static(path, options))
        }
        return this.use(express.static(path, options))
    }

    public setBaseViewsDir(path: string | string[]) {
        return this.set("views", path)
    }

    public setViewEngine(engine: string) {
        this.logger.debug("setViewEngine")

        return this.set("view engine", engine)
    }

    public getRequestHostname(request: any): string {
        this.logger.debug("getRequestHostname")
        return request.hostname
    }

    public getRequestMethod(request: any): string {
        this.logger.debug("getRequestMethod")

        return request.method
    }

    public getRequestUrl(request: any): string {
        this.logger.debug("getRequestUrl")
        return request.originalUrl
    }

    public enableCors(options: CorsOptions | CorsOptionsDelegate<any>) {
        this.logger.debug("enableCors")
        return this.use(cors(options as any))
    }

    public createMiddlewareFactory(
        requestMethod: RequestMethod,
    ): (path: string, callback: Function) => any {
        this.logger.debug("createMiddlewareFactory")

        return this.routerMethodFactory
            .get(this.instance, requestMethod)
            .bind(this.instance)
    }

    public initHttpServer(options: NestApplicationOptions) {
        this.logger.debug("initHttpServer")
        if (options?.httpsOptions) {
            this.httpServer = https.createServer(
                options.httpsOptions,
                this.getInstance(),
            )
        } else {
            this.httpServer = http.createServer(this.getInstance())
        }

        if (options?.forceCloseConnections) {
            this.trackOpenConnections()
        }
    }

    public registerParserMiddleware(prefix?: string, rawBody?: boolean) {
        this.logger.debug("registerParserMiddleware")
        const bodyParserJsonOptions = getBodyParserOptions(!!rawBody)
        const bodyParserUrlencodedOptions = getBodyParserOptions(!!rawBody, {
            extended: true,
        })

        const parserMiddleware = {
            jsonParser: bodyParserJson(bodyParserJsonOptions),
            urlencodedParser: bodyParserUrlencoded(bodyParserUrlencodedOptions),
        }
        Object.keys(parserMiddleware)
            .filter((parser) => !this.isMiddlewareApplied(parser))
            .forEach((parserKey) => this.use(parserMiddleware[parserKey]))
    }

    public useBodyParser<Options = any>(
        type: any,
        rawBody: boolean,
        options?: Omit<Options, "verify">,
    ): this {
        this.logger.debug("useBodyParser")
        const parserOptions = getBodyParserOptions<Options>(rawBody, options)
        const parser = bodyparser[type](parserOptions)

        this.use(parser)

        return this
    }

    public setLocal(key: string, value: any) {
        this.instance.locals[key] = value
        return this
    }

    public getType(): string {
        this.logger.debug("getType")
        return "express"
    }

    public applyVersionFilter(
        handler: Function,
        version: VersionValue,
        versioningOptions: VersioningOptions,
    ): VersionedRoute {
        this.logger.debug("applyVersionFilter")

        const callNextHandler: VersionedRoute = (req, res, next) => {
            if (!next) {
                throw new InternalServerErrorException(
                    "HTTP adapter does not support filtering on version",
                )
            }
            return next()
        }

        if (
            version === VERSION_NEUTRAL ||
            // URL Versioning is done via the path, so the filter continues forward
            versioningOptions.type === VersioningType.URI
        ) {
            const handlerForNoVersioning: VersionedRoute = (req, res, next) =>
                handler(req, res, next)

            return handlerForNoVersioning
        }

        // Custom Extractor Versioning Handler
        if (versioningOptions.type === VersioningType.CUSTOM) {
            const handlerForCustomVersioning: VersionedRoute = (
                req,
                res,
                next,
            ) => {
                const extractedVersion = versioningOptions.extractor(req)

                if (Array.isArray(version)) {
                    if (
                        Array.isArray(extractedVersion) &&
                        version.filter((v) =>
                            extractedVersion.includes(v as string),
                        ).length
                    ) {
                        return handler(req, res, next)
                    }

                    if (
                        isString(extractedVersion) &&
                        version.includes(extractedVersion)
                    ) {
                        return handler(req, res, next)
                    }
                } else if (isString(version)) {
                    // Known bug here - if there are multiple versions supported across separate
                    // handlers/controllers, we can't select the highest matching handler.
                    // Since this code is evaluated per-handler, then we can't see if the highest
                    // specified version exists in a different handler.
                    if (
                        Array.isArray(extractedVersion) &&
                        extractedVersion.includes(version)
                    ) {
                        return handler(req, res, next)
                    }

                    if (
                        isString(extractedVersion) &&
                        version === extractedVersion
                    ) {
                        return handler(req, res, next)
                    }
                }

                return callNextHandler(req, res, next)
            }

            return handlerForCustomVersioning
        }

        // Media Type (Accept Header) Versioning Handler
        if (versioningOptions.type === VersioningType.MEDIA_TYPE) {
            const handlerForMediaTypeVersioning: VersionedRoute = (
                req,
                res,
                next,
            ) => {
                const MEDIA_TYPE_HEADER = "Accept"
                const acceptHeaderValue: string | undefined =
                    req.headers?.[MEDIA_TYPE_HEADER] ||
                    req.headers?.[MEDIA_TYPE_HEADER.toLowerCase()]

                const acceptHeaderVersionParameter = acceptHeaderValue
                    ? acceptHeaderValue.split(";")[1]
                    : undefined

                // No version was supplied
                if (isUndefined(acceptHeaderVersionParameter)) {
                    if (Array.isArray(version)) {
                        if (version.includes(VERSION_NEUTRAL)) {
                            return handler(req, res, next)
                        }
                    }
                } else {
                    const headerVersion = acceptHeaderVersionParameter.split(
                        versioningOptions.key,
                    )[1]

                    if (Array.isArray(version)) {
                        if (version.includes(headerVersion)) {
                            return handler(req, res, next)
                        }
                    } else if (isString(version)) {
                        if (version === headerVersion) {
                            return handler(req, res, next)
                        }
                    }
                }

                return callNextHandler(req, res, next)
            }

            return handlerForMediaTypeVersioning
        }

        // Header Versioning Handler
        if (versioningOptions.type === VersioningType.HEADER) {
            const handlerForHeaderVersioning: VersionedRoute = (
                req,
                res,
                next,
            ) => {
                const customHeaderVersionParameter: string | undefined =
                    req.headers?.[versioningOptions.header] ||
                    req.headers?.[versioningOptions.header.toLowerCase()]

                // No version was supplied
                if (isUndefined(customHeaderVersionParameter)) {
                    if (Array.isArray(version)) {
                        if (version.includes(VERSION_NEUTRAL)) {
                            return handler(req, res, next)
                        }
                    }
                } else {
                    if (Array.isArray(version)) {
                        if (version.includes(customHeaderVersionParameter)) {
                            return handler(req, res, next)
                        }
                    } else if (isString(version)) {
                        if (version === customHeaderVersionParameter) {
                            return handler(req, res, next)
                        }
                    }
                }

                return callNextHandler(req, res, next)
            }

            return handlerForHeaderVersioning
        }

        return callNextHandler
    }

    private trackOpenConnections() {
        this.httpServer.on("connection", (socket: Duplex) => {
            this.openConnections.add(socket)

            socket.on("close", () => this.openConnections.delete(socket))
        })
    }

    private closeOpenConnections() {
        for (const socket of this.openConnections) {
            socket.destroy()
            this.openConnections.delete(socket)
        }
    }

    private isMiddlewareApplied(name: string): boolean {
        this.logger.debug("isMiddlewareApplied")

        const app = this.getInstance()
        return (
            !!app._router &&
            !!app._router.stack &&
            isFunction(app._router.stack.filter) &&
            app._router.stack.some(
                (layer: any) =>
                    layer && layer.handle && layer.handle.name === name,
            )
        )
    }
}
