import type { RawBodyRequest } from "@nestjs/common"
import type { IncomingMessage, ServerResponse } from "http"

const rawBodyParser = (
    req: RawBodyRequest<IncomingMessage>,
    _res: ServerResponse,
    buffer: Buffer,
) => {
    if (Buffer.isBuffer(buffer)) {
        req.rawBody = buffer
    }
    return true
}

interface NestHonoBodyParserOptions {}

export function getBodyParserOptions<Options = NestHonoBodyParserOptions>(
    rawBody: boolean,
    options?: Omit<Options, "verify"> | undefined,
): Options {
    let parserOptions: Options = (options || {}) as Options

    if (rawBody) {
        parserOptions = {
            ...parserOptions,
            verify: rawBodyParser,
        }
    }

    return parserOptions
}
