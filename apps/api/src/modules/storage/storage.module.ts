import { Module } from "@nestjs/common";
import { LocalStorageAdapter } from "@qr-platform/storage";

import { AppConfigService } from "../../common/config/app-config.service";

import { STORAGE_SERVICE } from "./storage.tokens";

// Infrastructure only: provides `StorageService` for future modules to
// inject (e.g. a product-image upload module). No controller/endpoint here
// by design - Sprint 0 has no upload feature yet.
@Module({
  providers: [
    {
      provide: STORAGE_SERVICE,
      inject: [AppConfigService],
      useFactory: (appConfig: AppConfigService) =>
        new LocalStorageAdapter(appConfig.storageDir, {
          maxFileSizeMb: appConfig.storageMaxFileSizeMb,
          allowedMimeTypes: appConfig.storageAllowedMimeTypes,
        }),
    },
  ],
  exports: [STORAGE_SERVICE],
})
export class StorageModule {}
