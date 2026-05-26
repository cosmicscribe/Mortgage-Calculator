import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const corsOrigin = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(",") : "*";

  app.enableCors({
    origin: corsOrigin
  });
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true
    })
  );

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
  console.log(`Server running on port ${port}`);
}

void bootstrap();
