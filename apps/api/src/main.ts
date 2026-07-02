import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { PrismaService } from "./common/prisma.service";
import { validateProductionEnv } from "./config/production-env";
import { LoggingExceptionFilter } from "./platform/logging-exception.filter";

async function bootstrap() {
  validateProductionEnv();

  const app = await NestFactory.create(AppModule);
  if (process.env.TRUST_PROXY === "true") {
    app.getHttpAdapter().getInstance().set("trust proxy", 1);
  }
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(",") ?? ["http://localhost:3000"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  });
  app.setGlobalPrefix("api");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true
    })
  );
  app.useGlobalFilters(new LoggingExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle("Bill4 API")
    .setDescription("Tournament and club ecosystem API")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  const doc = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, doc);

  const prisma = app.get(PrismaService);
  await prisma.enableShutdownHooks(app);
  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port, "0.0.0.0");
}

bootstrap();
