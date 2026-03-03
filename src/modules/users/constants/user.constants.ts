import { UserPreferences } from '../interfaces/user-preferences.interface.js';

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  currency: 'EUR',
  language: 'es',
  dateFormat: 'DD/MM/YYYY',
};

export const MAX_PROFILE_IMAGE_SIZE = 5 * 1024 * 1024;
