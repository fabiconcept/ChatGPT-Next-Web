import { LLMModel } from "../client/api";
import { DalleSize, DalleQuality, DalleStyle } from "../typing";
import { getClientConfig } from "../config/client";
import { getSession } from "next-auth/react";
import { debug } from "../utils/debug";

const log = {
  sync: debug("app:config:sync"),
  storage: debug("app:config:storage"),
  state: debug("app:config:state"),
};

import {
  DEFAULT_INPUT_TEMPLATE,
  DEFAULT_MODELS,
  DEFAULT_SIDEBAR_WIDTH,
  DEFAULT_TTS_ENGINE,
  DEFAULT_TTS_ENGINES,
  DEFAULT_TTS_MODEL,
  DEFAULT_TTS_MODELS,
  DEFAULT_TTS_VOICE,
  DEFAULT_TTS_VOICES,
  StoreKey,
  ServiceProvider,
} from "../constant";
import { createPersistStore } from "../utils/store";
import type { Voice } from "rt-client";

export type ModelType = (typeof DEFAULT_MODELS)[number]["name"];
export type TTSModelType = (typeof DEFAULT_TTS_MODELS)[number];
export type TTSVoiceType = (typeof DEFAULT_TTS_VOICES)[number];
export type TTSEngineType = (typeof DEFAULT_TTS_ENGINES)[number];

export enum SubmitKey {
  Enter = "Enter",
  CtrlEnter = "Ctrl + Enter",
  ShiftEnter = "Shift + Enter",
  AltEnter = "Alt + Enter",
  MetaEnter = "Meta + Enter",
}

export enum Theme {
  Auto = "auto",
  Dark = "dark",
  Light = "light",
}

const config = getClientConfig();

export const DEFAULT_CONFIG = {
  lastUpdate: Date.now(), // timestamp, to merge state
  lastSyncTime: 0, // timestamp of last successful sync
  syncStatus: "idle" as "idle" | "syncing" | "error",
  syncError: null as string | null,

  submitKey: SubmitKey.Enter,
  avatar: "1f603",
  fontSize: 14,
  fontFamily: "",
  theme: Theme.Auto as Theme,
  tightBorder: !!config?.isApp,
  sendPreviewBubble: true,
  enableAutoGenerateTitle: true,
  sidebarWidth: DEFAULT_SIDEBAR_WIDTH,

  enableArtifacts: true, // show artifacts config

  enableCodeFold: true, // code fold config

  disablePromptHint: false,

  dontShowMaskSplashScreen: false, // dont show splash screen when create chat
  hideBuiltinMasks: false, // dont add builtin masks

  customModels: "",
  models: DEFAULT_MODELS as any as LLMModel[],

  modelConfig: {
    model: "gpt-4o-mini" as ModelType,
    providerName: "OpenAI" as ServiceProvider,
    temperature: 0.5,
    top_p: 1,
    max_tokens: 4000,
    presence_penalty: 0,
    frequency_penalty: 0,
    sendMemory: true,
    historyMessageCount: 4,
    compressMessageLengthThreshold: 1000,
    compressModel: "",
    compressProviderName: "",
    enableInjectSystemPrompts: true,
    template: config?.template ?? DEFAULT_INPUT_TEMPLATE,
    size: "1024x1024" as DalleSize,
    quality: "standard" as DalleQuality,
    style: "vivid" as DalleStyle,
  },

  ttsConfig: {
    enable: false,
    autoplay: false,
    engine: DEFAULT_TTS_ENGINE,
    model: DEFAULT_TTS_MODEL,
    voice: DEFAULT_TTS_VOICE,
    speed: 1.0,
  },

  realtimeConfig: {
    enable: false,
    provider: "OpenAI" as ServiceProvider,
    model: "gpt-4o-realtime-preview-2024-10-01",
    apiKey: "",
    azure: {
      endpoint: "",
      deployment: "",
    },
    temperature: 0.9,
    voice: "alloy" as Voice,
  },
};

export type ChatConfig = typeof DEFAULT_CONFIG;

export type ModelConfig = ChatConfig["modelConfig"];
export type TTSConfig = ChatConfig["ttsConfig"];
export type RealtimeConfig = ChatConfig["realtimeConfig"];

export function limitNumber(
  x: number,
  min: number,
  max: number,
  defaultValue: number,
) {
  if (isNaN(x)) {
    return defaultValue;
  }

  return Math.min(max, Math.max(min, x));
}

export const TTSConfigValidator = {
  engine(x: string) {
    return x as TTSEngineType;
  },
  model(x: string) {
    return x as TTSModelType;
  },
  voice(x: string) {
    return x as TTSVoiceType;
  },
  speed(x: number) {
    return limitNumber(x, 0.25, 4.0, 1.0);
  },
};

export const ModalConfigValidator = {
  model(x: string) {
    return x as ModelType;
  },
  max_tokens(x: number) {
    return limitNumber(x, 0, 512000, 1024);
  },
  presence_penalty(x: number) {
    return limitNumber(x, -2, 2, 0);
  },
  frequency_penalty(x: number) {
    return limitNumber(x, -2, 2, 0);
  },
  temperature(x: number) {
    return limitNumber(x, 0, 2, 1);
  },
  top_p(x: number) {
    return limitNumber(x, 0, 1, 1);
  },
};

export const useAppConfig = createPersistStore(
  { ...DEFAULT_CONFIG },
  (set, get) => ({
    async reset() {
      log.state("Resetting config to defaults");
      set(() => ({ ...DEFAULT_CONFIG }));

      // Reset settings in the database
      const session = await getSession();
      if (session?.user?.id) {
        try {
          log.state("Resetting settings in database");
          const defaultSettings = {
            ...DEFAULT_CONFIG,
            lastUpdateTime: Date.now(),
          };

          const response = await fetch("/api/user-settings", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "user-id": session.user.id,
            },
            body: JSON.stringify(defaultSettings),
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
              `Failed to reset settings: ${response.status} ${response.statusText}\n${errorText}`,
            );
          }

          log.state("Settings reset successfully in database");
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          log.state("Failed to reset settings in database:", errorMessage);
          console.error("Failed to reset settings in database:", error);
          // Still throw the error to notify the user
          throw error;
        }
      }
    },

    async syncWithServer() {
      log.sync("Starting syncWithServer");
      const session = await getSession();
      log.sync("Session state:", {
        hasSession: !!session,
        userId: session?.user?.id,
        user: session?.user,
      });

      if (!session?.user?.id) {
        log.sync("No user session found, aborting sync");
        return;
      }

      try {
        log.sync("Setting sync status to syncing");
        set({ syncStatus: "syncing", syncError: null });

        log.sync("Fetching settings from server");
        const response = await fetch("/api/user-settings", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "user-id": session.user.id,
          },
        });

        log.sync("Server response status:", response.status);
        if (!response.ok) {
          throw new Error(
            `Failed to fetch settings: ${response.status} ${response.statusText}`,
          );
        }

        const data = await response.json();
        log.sync("Received settings from server:", data);
        log.sync("Received settings from server:", data.data.userId);

        if (data.data.userId) {
          log.sync("Updating local state with server settings");
          const newState = {
            ...data.data,
            lastSyncTime: Date.now(),
            syncStatus: "idle",
            syncError: null,
          };
          log.state("New state:", newState);
          set(newState);
        } else {
          log.sync("No settings found in server response");
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        log.sync("Sync error:", errorMessage, error);
        console.error("Failed to sync settings:", error);
        set({
          syncStatus: "error",
          syncError: errorMessage,
        });
      }
    },

    async saveToServer() {
      log.sync("Starting saveToServer");
      const session = await getSession();
      log.sync("Session state:", {
        hasSession: !!session,
        userId: session?.user?.id,
        user: session?.user,
      });

      if (!session?.user?.id) {
        log.sync("No user session found, aborting save");
        return;
      }

      const currentState = get();
      const settings = {
        submitKey: currentState.submitKey,
        avatar: currentState.avatar,
        fontSize: currentState.fontSize,
        fontFamily: currentState.fontFamily,
        theme: currentState.theme,
        tightBorder: currentState.tightBorder,
        sendPreviewBubble: currentState.sendPreviewBubble,
        enableAutoGenerateTitle: currentState.enableAutoGenerateTitle,
        sidebarWidth: currentState.sidebarWidth,
        enableArtifacts: currentState.enableArtifacts,
        enableCodeFold: currentState.enableCodeFold,
        disablePromptHint: currentState.disablePromptHint,
        dontShowMaskSplashScreen: currentState.dontShowMaskSplashScreen,
        hideBuiltinMasks: currentState.hideBuiltinMasks,
        ttsConfig: currentState.ttsConfig,
        modelConfig: currentState.modelConfig,
        realtimeConfig: currentState.realtimeConfig,
        customModels: currentState.customModels,
        lastUpdateTime: Date.now(),
      };

      log.sync("Preparing to save settings:", settings);

      try {
        log.sync("Setting sync status to syncing");
        set({ syncStatus: "syncing", syncError: null });

        log.sync("Sending settings to server");
        const response = await fetch("/api/user-settings", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "user-id": session.user.id,
          },
          body: JSON.stringify(settings),
        });

        log.sync("Server response status:", response.status);
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Failed to save settings: ${response.status} ${response.statusText}\n${errorText}`,
          );
        }

        const data = await response.json();
        log.sync("Settings saved successfully", data);

        set({
          lastSyncTime: Date.now(),
          syncStatus: "idle",
          syncError: null,
        });

        return data;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        log.sync("Save error:", errorMessage, error);
        console.error("Failed to save settings:", error);
        set({
          syncStatus: "error",
          syncError: errorMessage,
        });
        throw error; // Re-throw to let callers handle the error
      }
    },

    mergeModels(newModels: LLMModel[]) {
      if (!newModels || newModels.length === 0) {
        return;
      }

      const oldModels = get().models;
      const modelMap: Record<string, LLMModel> = {};

      for (const model of oldModels) {
        model.available = false;
        modelMap[`${model.name}@${model?.provider?.id}`] = model;
      }

      for (const model of newModels) {
        model.available = true;
        modelMap[`${model.name}@${model?.provider?.id}`] = model;
      }

      set(() => ({
        models: Object.values(modelMap),
      }));
    },

    allModels() {},
  }),
  {
    name: StoreKey.Config,
    version: 4.2,
    onRehydrateStorage: () => async (state) => {
      if (!state) {
        log.storage("No state found during rehydration");
        return;
      }

      log.storage("Starting storage rehydration");
      const session = await getSession();
      log.storage("Session state:", {
        hasSession: !!session,
        userId: session?.user?.id,
        user: session?.user,
      });

      if (session?.user?.id) {
        log.storage("User session found, initiating sync");
        state.syncWithServer();
      } else {
        log.storage("No user session found, skipping sync");
      }
    },

    merge(persistedState, currentState) {
      const state = persistedState as ChatConfig | undefined;
      if (!state) return { ...currentState };
      const models = currentState.models.slice();
      state.models.forEach((pModel) => {
        const idx = models.findIndex(
          (v) => v.name === pModel.name && v.provider === pModel.provider,
        );
        if (idx !== -1) models[idx] = pModel;
        else models.push(pModel);
      });
      return { ...currentState, ...state, models: models };
    },

    migrate(persistedState, version) {
      const state = persistedState as ChatConfig;

      if (version < 3.4) {
        state.modelConfig.sendMemory = true;
        state.modelConfig.historyMessageCount = 4;
        state.modelConfig.compressMessageLengthThreshold = 1000;
        state.modelConfig.frequency_penalty = 0;
        state.modelConfig.top_p = 1;
        state.modelConfig.template = DEFAULT_INPUT_TEMPLATE;
        state.dontShowMaskSplashScreen = false;
        state.hideBuiltinMasks = false;
      }

      if (version < 3.5) {
        state.customModels = "claude,claude-100k";
      }

      if (version < 3.6) {
        state.modelConfig.enableInjectSystemPrompts = true;
      }

      if (version < 3.7) {
        state.enableAutoGenerateTitle = true;
      }

      if (version < 3.8) {
        state.lastUpdate = Date.now();
      }

      if (version < 3.9) {
        state.modelConfig.template =
          state.modelConfig.template !== DEFAULT_INPUT_TEMPLATE
            ? state.modelConfig.template
            : config?.template ?? DEFAULT_INPUT_TEMPLATE;
      }

      if (version < 4.1) {
        state.modelConfig.compressModel =
          DEFAULT_CONFIG.modelConfig.compressModel;
        state.modelConfig.compressProviderName =
          DEFAULT_CONFIG.modelConfig.compressProviderName;
      }

      return state as any;
    },
  },
);
