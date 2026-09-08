export type HealthProfileId = string;

export type HealthProfileIdentity = {
  id: HealthProfileId;
  displayName: string;
  birthDate: string;
  sexForGrowthReference: "male" | "female" | "";
  avatarLocalReference?: string;
  createdAt: string;
  updatedAt: string;
};

export type HealthProfileBackground = {
  profileId: HealthProfileId;
  preferredName?: string;
  bloodTypeText?: string;
  primaryCareProviderText?: string;
  importantNotes?: string;
  assistiveDevices?: string[];
  schoolHealthNotes?: string;
  updatedAt: string;
};

export type HealthProfileRegistry = {
  schemaVersion: 1;
  profiles: HealthProfileIdentity[];
  activeProfileId?: HealthProfileId;
  updatedAt: string;
};

export type ProfileMigrationEnvelope = {
  fromSingleProfileState: true;
  createdProfileId: HealthProfileId;
  migratedAt: string;
  legacyStorageKeyPreserved: true;
};

export const HEALTH_PROFILE_RULES = {
  everyHealthRecordRequiresProfileId: true,
  activeProfileMustBeExplicit: true,
  noCrossProfileTimelineMixing: true,
  noCrossProfileReminderMixing: true,
  profileDeletionRequiresExplicitConfirmation: true,
  exportIsProfileScopedByDefault: true,
  deviceAccessDoesNotGrantAllProfileVisibility: true,
} as const;

// Runtime Profile Registry V1 đã tách state theo profileId/storage key và giữ legacy key để rollback.
// Các record bên trong HealthLocalState chưa được nhúng profileId riêng ở V1; isolation hiện được đảm bảo bởi profile-scoped state.
// Khi nâng schema record-level phải thêm profileId mà không phá backup legacy và tiếp tục test chống trộn dữ liệu.
