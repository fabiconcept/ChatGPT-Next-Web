import { ServiceProvider } from "@/app/constant";
import { ModalConfigValidator } from "../store";
import Locale from "../locales";
import { InputRange } from "./input-range";
import { ListItem, Select } from "./ui-lib";
import { useAllModels, useGlobalConfig } from "../utils/hooks";
import { groupBy } from "lodash-es";
import styles from "./model-config.module.scss";
import { getModelProvider } from "../utils/model";
import { Loading } from "./loading";
import { IAIModel } from "../database/types";

export function ModelConfigList() {
  const { config, loading, error, updateConfig } = useGlobalConfig();
  const allModels = useAllModels();

  if (loading) {
    return <Loading />;
  }

  if (error || !config) {
    return (
      <div className="error">
        Error loading configuration: {JSON.stringify(error)}
      </div>
    );
  }

  const groupModels = groupBy(
    allModels.filter((v) => v.available),
    "provider.providerName",
  );

  const value = `${config.model}@${config.providerName}`;

  const handleUpdateConfig = async (
    main: Partial<IAIModel>,
    defaultSettings?: Partial<IAIModel["defaultSettings"]>,
  ) => {
    try {
      await updateConfig(main, defaultSettings);
    } catch (err) {
      console.error("Failed to update config:", err);
      // You might want to show an error toast here
    }
  };

  return (
    <>
      <ListItem title={Locale.Settings.Model}>
        <Select
          aria-label={Locale.Settings.Model}
          value={value}
          onChange={(e) => {
            const [model, providerName] = getModelProvider(
              e.currentTarget.value,
            );

            handleUpdateConfig({
              model: ModalConfigValidator.model(model),
              providerName: providerName as ServiceProvider,
            });
          }}
        >
          {Object.keys(groupModels).map((providerName, index) => (
            <optgroup label={providerName} key={index}>
              {groupModels[providerName].map((v, i) => (
                <option value={`${v.name}@${v.provider?.providerName}`} key={i}>
                  {v.displayName}
                </option>
              ))}
            </optgroup>
          ))}
        </Select>
      </ListItem>

      <ListItem
        title={Locale.Settings.Temperature.Title}
        subTitle={Locale.Settings.Temperature.SubTitle}
      >
        <InputRange
          aria={Locale.Settings.Temperature.Title}
          value={config.defaultSettings.temperature}
          min="0"
          max="1"
          step="0.1"
          onChange={(e) => {
            handleUpdateConfig(
              {},
              {
                temperature: ModalConfigValidator.temperature(
                  e.currentTarget.valueAsNumber,
                ),
              },
            );
          }}
        ></InputRange>
      </ListItem>

      <ListItem
        title={Locale.Settings.TopP.Title}
        subTitle={Locale.Settings.TopP.SubTitle}
      >
        <InputRange
          aria={Locale.Settings.TopP.Title}
          value={config.defaultSettings.topP}
          min="0"
          max="1"
          step="0.1"
          onChange={(e) => {
            handleUpdateConfig(
              {},
              {
                topP: ModalConfigValidator.top_p(e.currentTarget.valueAsNumber),
              },
            );
          }}
        ></InputRange>
      </ListItem>

      <ListItem
        title={Locale.Settings.MaxTokens.Title}
        subTitle={Locale.Settings.MaxTokens.SubTitle}
      >
        <input
          type="number"
          min={100}
          max={100000}
          value={config.defaultSettings.maxTokens}
          onChange={(e) => {
            handleUpdateConfig(
              {},
              {
                maxTokens: ModalConfigValidator.max_tokens(
                  e.currentTarget.valueAsNumber,
                ),
              },
            );
          }}
        ></input>
      </ListItem>

      {config.providerName == ServiceProvider.Google ? null : (
        <>
          <ListItem
            title={Locale.Settings.PresencePenalty.Title}
            subTitle={Locale.Settings.PresencePenalty.SubTitle}
          >
            <InputRange
              aria={Locale.Settings.PresencePenalty.Title}
              value={config.defaultSettings.presencePenalty}
              min="-2"
              max="2"
              step="0.1"
              onChange={(e) => {
                handleUpdateConfig(
                  {},
                  {
                    presencePenalty: ModalConfigValidator.presence_penalty(
                      e.currentTarget.valueAsNumber,
                    ),
                  },
                );
              }}
            ></InputRange>
          </ListItem>

          <ListItem
            title={Locale.Settings.FrequencyPenalty.Title}
            subTitle={Locale.Settings.FrequencyPenalty.SubTitle}
          >
            <InputRange
              aria={Locale.Settings.FrequencyPenalty.Title}
              value={config.defaultSettings.frequencyPenalty}
              min="-2"
              max="2"
              step="0.1"
              onChange={(e) => {
                handleUpdateConfig(
                  {},
                  {
                    frequencyPenalty: ModalConfigValidator.frequency_penalty(
                      e.currentTarget.valueAsNumber,
                    ),
                  },
                );
              }}
            ></InputRange>
          </ListItem>

          <ListItem
            title={Locale.Settings.InjectSystemPrompts.Title}
            subTitle={Locale.Settings.InjectSystemPrompts.SubTitle}
          >
            <input
              type="checkbox"
              checked={config.defaultSettings.enableInjectSystemPrompts}
              onChange={(e) => {
                handleUpdateConfig(
                  {},
                  {
                    enableInjectSystemPrompts: e.currentTarget.checked,
                  },
                );
              }}
            ></input>
          </ListItem>

          <ListItem
            title={Locale.Settings.InputTemplate.Title}
            subTitle={Locale.Settings.InputTemplate.SubTitle}
          >
            <input
              type="text"
              value={config.defaultSettings.template}
              onChange={(e) => {
                handleUpdateConfig(
                  {},
                  {
                    template: e.currentTarget.value,
                  },
                );
              }}
            ></input>
          </ListItem>
        </>
      )}

      <ListItem
        title={Locale.Settings.HistoryCount.Title}
        subTitle={Locale.Settings.HistoryCount.SubTitle}
      >
        <InputRange
          aria={Locale.Settings.HistoryCount.Title}
          title={config.defaultSettings.historyMessageCount.toString()}
          value={config.defaultSettings.historyMessageCount}
          min="0"
          max="64"
          step="1"
          onChange={(e) => {
            handleUpdateConfig(
              {},
              {
                historyMessageCount: e.target.valueAsNumber,
              },
            );
          }}
        ></InputRange>
      </ListItem>

      <ListItem
        title={Locale.Settings.CompressThreshold.Title}
        subTitle={Locale.Settings.CompressThreshold.SubTitle}
      >
        <input
          type="number"
          min={500}
          max={4000}
          value={config.defaultSettings.compressMessageLengthThreshold}
          onChange={(e) => {
            handleUpdateConfig(
              {},
              {
                compressMessageLengthThreshold: e.currentTarget.valueAsNumber,
              },
            );
          }}
        ></input>
      </ListItem>

      <ListItem title={Locale.Memory.Title} subTitle={Locale.Memory.Send}>
        <input
          type="checkbox"
          checked={config.defaultSettings.sendMemory}
          onChange={(e) => {
            handleUpdateConfig(
              {},
              {
                sendMemory: e.currentTarget.checked,
              },
            );
          }}
        ></input>
      </ListItem>

      <ListItem
        title={Locale.Settings.CompressModel.Title}
        subTitle={Locale.Settings.CompressModel.SubTitle}
      >
        <Select
          className={styles["select-compress-model"]}
          aria-label={Locale.Settings.CompressModel.Title}
          value={`${config.defaultSettings.compressModel}@${config.defaultSettings.compressProviderName}`}
          onChange={(e) => {
            const [model, providerName] = getModelProvider(
              e.currentTarget.value,
            );
            handleUpdateConfig(
              {},
              {
                compressModel: ModalConfigValidator.model(model),
                compressProviderName: providerName as ServiceProvider,
              },
            );
          }}
        >
          {allModels
            .filter((v) => v.available)
            .map((v, i) => (
              <option value={`${v.name}@${v.provider?.providerName}`} key={i}>
                {v.displayName}({v.provider?.providerName})
              </option>
            ))}
        </Select>
      </ListItem>
    </>
  );
}
