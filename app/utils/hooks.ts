import { useMemo, useEffect, useState } from "react";
import { useAccessStore, useAppConfig } from "../store";
import { collectModelsWithDefaultModel } from "./model";
import { IAIModel } from "../database/types";

export function useAllModels() {
  const accessStore = useAccessStore();
  const configStore = useAppConfig();
  const models = useMemo(() => {
    return collectModelsWithDefaultModel(
      configStore.models,
      [configStore.customModels, accessStore.customModels].join(","),
      accessStore.defaultModel,
    );
  }, [
    accessStore.customModels,
    accessStore.defaultModel,
    configStore.customModels,
    configStore.models,
  ]);

  return models;
}

export function useGlobalConfig() {
  const [config, setConfig] = useState<IAIModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      console.log("[Config] Starting to fetch configurations...");
      try {
        const response = await fetch("/api/configurations");
        console.log("[Config] Response status:", response.status);
        console.log(
          "[Config] Response headers:",
          Object.fromEntries(response.headers.entries()),
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error("[Config] Response not OK:", {
            status: response.status,
            statusText: response.statusText,
            body: errorText,
          });
          throw new Error(
            `Failed to fetch configurations: ${response.status} ${response.statusText}\n${errorText}`,
          );
        }

        const data = (await response.json()) as IAIModel[];
        console.log("[Config] Received data:", data);

        if (!data || !Array.isArray(data) || data.length === 0) {
          console.error("[Config] Invalid or empty data received:", data);
          throw new Error("No configuration data available");
        }

        // We only need the defaultSettings from the first configuration
        setConfig(data[0]);
        console.log("[Config] Configuration set successfully:", data[0]);
      } catch (err) {
        console.error("[Config] Error details:", {
          error: err,
        });

        // Store the full error object for debugging
        setError({
          message: err instanceof Error ? err.message : "Unknown error",
          details:
            err instanceof Error
              ? {
                  name: err.name,
                  stack: err.stack,
                  cause: err.cause,
                }
              : err,
        });
      } finally {
        setLoading(false);
        console.log("[Config] Fetch operation completed");
      }
    };

    fetchConfig();
  }, []);

  const updateConfig = async (
    updatedConfig: Partial<IAIModel>,
    defaultSettings?: Partial<IAIModel["defaultSettings"]>,
  ) => {
    if (!config) return;

    try {
      const payload = {
        ...config,
        defaultSettings: {
          ...config.defaultSettings,
          ...defaultSettings,
        },
        ...updatedConfig,
      };

      console.log({
        payload,
      });

      const response = await fetch("/api/configurations", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...payload,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to update configuration: ${response.status} ${response.statusText}`,
        );
      }

      const data = (await response.json()) as IAIModel;
      setConfig(data);
      console.log("[Config] Update successful:", data);
    } catch (err) {
      console.error("[Config] Update error details:", {
        error: err,
      });
      throw err;
    }
  };

  return { config, loading, error, updateConfig };
}
