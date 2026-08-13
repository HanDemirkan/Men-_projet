export interface QrDefaults {
  errorCorrectionLevel: "L" | "M" | "Q" | "H";
  includeLogo: boolean;
}

export interface BusinessSettingsData {
  timezone: string;
  dateFormat: string;
  priceDisplayFormat: "WITH_CURRENCY" | "NUMBER_ONLY";
  qrDefaults: QrDefaults;
}

// Same "null in the DB means defaults, computed at read time" convention as
// storefrontConfig (ADR 0009) - no migration needed to change a default.
export const DEFAULT_BUSINESS_SETTINGS: BusinessSettingsData = {
  timezone: "Europe/Istanbul",
  dateFormat: "DD.MM.YYYY",
  priceDisplayFormat: "WITH_CURRENCY",
  qrDefaults: { errorCorrectionLevel: "Q", includeLogo: false },
};

export interface BusinessSettings extends BusinessSettingsData {
  language: string;
  currency: string;
  tenantStatus: string;
}
