export enum Collections {
  USERS = "users",
  AI_MODELS = "ai_models",
  MEMBERSHIPS = "memberships",
  CHAT_LOGS = "chat_logs",
  USER_SUBSCRIPTIONS = "user_subscriptions",
  USER_SETTINGS = "user_settings",
}

export interface IUser {
  userId: string;
  email?: string;
  phoneNumber?: string;
  passwordHash?: string;
  name?: string;
  createdAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
  loginMethods: string[];
  otp?: string;
  otpExpiry?: Date;
  isVerified: boolean;
  userType: "user" | "admin";
  subscriptionType?: string; // References membershipId
}

export interface IAIModel {
  modelType: string;
  version: string;
  model: string;
  providerName: string;
  defaultSettings: {
    temperature: number;
    maxTokens: number;
    topP: number;
    frequencyPenalty: number;
    presencePenalty: number;
    compressMessageLengthThreshold: number;
    enableInjectSystemPrompts: boolean;
    template: string;
    historyMessageCount: number;
    sendMemory: boolean;
    compressModel: string;
    compressProviderName: string;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMembership {
  membershipId: string;
  name: string;
  description: string;
  price: number;
  features: string[];
  maxTokens: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IChatLog {
  userId: string;
  modelId: string;
  messages: Array<{
    role: "user" | "assistant" | "system";
    content: string;
    timestamp: Date;
  }>;
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost: number;
  createdAt: Date;
}

export interface IUserSubscription {
  userId: string;
  membershipId: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  tokenUsage: number;
  paymentStatus: "active" | "cancelled" | "expired";
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserSettings {
  userId: string;
  settings: {
    submitKey: string;
    avatar: string;
    fontSize: number;
    fontFamily: string;
    theme: string;
    tightBorder: boolean;
    sendPreviewBubble: boolean;
    enableAutoGenerateTitle: boolean;
    sidebarWidth: number;
    enableArtifacts: boolean;
    enableCodeFold: boolean;
    disablePromptHint: boolean;
    dontShowMaskSplashScreen: boolean;
    hideBuiltinMasks: boolean;
    ttsConfig: {
      enable: boolean;
      autoplay: boolean;
      engine: string;
      model: string;
      voice: string;
      speed: number;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}
