import { Test, TestingModule } from "@nestjs/testing";
import { AppController } from "./app.controller";

describe("AppController", () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  it("reports health", () => {
    expect(appController.health()).toEqual({
      status: "ok",
      service: "reservation",
    });
  });
});
