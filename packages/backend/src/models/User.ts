export interface User {
  id: string;
  email: string;
  passwordHash: string;
  username: string;
  preferredLanguage: 'id' | 'zh' | 'en';
  createdAt: Date;
  lastLoginAt: Date | null;
  settings: UserSettings;
}

export interface UserSettings {
  uiLanguage: 'id' | 'zh' | 'en';
  emailNotifications: boolean;
  theme: 'light' | 'dark';
}

export interface CreateUserDto {
  email: string;
  password: string;
  username: string;
  preferredLanguage?: 'id' | 'zh' | 'en';
}

export interface UpdateUserDto {
  username?: string;
  preferredLanguage?: 'id' | 'zh' | 'en';
  settings?: Partial<UserSettings>;
}

export interface UserResponse {
  id: string;
  email: string;
  username: string;
  preferredLanguage: 'id' | 'zh' | 'en';
  createdAt: Date;
  lastLoginAt: Date | null;
  settings: UserSettings;
}

// Convert User to UserResponse (exclude sensitive data)
export function toUserResponse(user: User): UserResponse {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    preferredLanguage: user.preferredLanguage,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
    settings: user.settings,
  };
}
