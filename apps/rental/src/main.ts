import "dotenv/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  // Only the gateway calls Rental; browser routes remain on the BFF.
  await app.listen(process.env.RENTAL_PORT ?? 3004);
}
void bootstrap();
