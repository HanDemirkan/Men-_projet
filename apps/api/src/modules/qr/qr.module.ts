import { Module } from "@nestjs/common";

import { StorageModule } from "../storage/storage.module";

import { QrController } from "./qr.controller";
import { QrService } from "./qr.service";

@Module({
  imports: [StorageModule],
  controllers: [QrController],
  providers: [QrService],
})
export class QrModule {}
