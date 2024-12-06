export enum Collections {
  USERS = "users",
  AI_MODELS = "ai_models",
  MEMBERSHIPS = "memberships",
  CHAT_LOGS = "chat_logs",
  USER_SUBSCRIPTIONS = "user_subscriptions",
}

export interface IUser {
  email: string;
  phoneNumber?: string;
  passwordHash: string;
  name: string;
  createdAt: Date;
  lastLoginAt: Date;
  isActive: boolean;
  loginMethods: string[];
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
  name: string;
  description: string;
  price: number;
  features: string[];
  maxTokensPerMonth: number;
  maxChatsPerDay: number;
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
