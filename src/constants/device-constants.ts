export const PHONE_TYPES = Object.freeze({
  IPHONE: "iphone",
  ANDROID: "android",
} as const);

export type PhoneType = (typeof PHONE_TYPES)[keyof typeof PHONE_TYPES];

export const OS_TYPES = Object.freeze({
  IOS: "iOS",
  ANDROID: "Android",
});

export const MINIMUM_IOS_VERSION = 15;
