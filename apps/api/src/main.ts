import "dotenv/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configuredOrigins = (process.env.FRONTEND_URL ?? "")
    .split(",")
    .map((url) => url.trim().replace(/\/+$/, ""))
    .filter(Boolean);

  const allowedOrigins = new Set([
    "http://localhost:3000",
    ...configuredOrigins,
  ]);

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Allow server-to-server, curl, mobile, or same-origin requests without an Origin header
      if (!origin) {
        return callback(null, true);
      }

      try {
        const parsed = new URL(origin);
        if (allowedOrigins.has(origin) || parsed.hostname.endsWith(".vercel.app")) {
          return callback(null, true);
        }
      } catch {
        if (allowedOrigins.has(origin)) {
          return callback(null, true);
        }
      }

      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  });
  const port = process.env.PORT ?? 5000;
  await app.listen(port, "0.0.0.0");
  console.log(`Application is running on: http://0.0.0.0:${port}`);
}
await bootstrap();
