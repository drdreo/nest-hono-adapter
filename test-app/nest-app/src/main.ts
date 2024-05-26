import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { HonoAdapter } from "../../../adapter/hono-adapter";
import { NestHonoApplication } from "../../../interfaces/nest-hono-application.interface";
import { Logger } from "@nestjs/common";

async function bootstrap() {
    const app = await NestFactory.create<NestHonoApplication>(AppModule, new HonoAdapter());
    // const app = await NestFactory.create<NestExpressApplication>(
    //   AppModule,
    //   new ExpressTestAdapter(),
    // )

    await app.listen(3000);
    Logger.log(`Application is running on: ${await app.getUrl()}`, "Bootstrap");
}

bootstrap();
