import "dotenv/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const allowedOrigins = [
    "http://localhost:3000",
    process.env.FRONTEND_URL,
  ].filter(Boolean) as string[];

  app.enableCors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
    credentials: true,
  });
  const port = process.env.PORT ?? 5000;
  await app.listen(port, "0.0.0.0");
  console.log(`Application is running on: http://0.0.0.0:${port}`);
}
await bootstrap();
