import { debug } from "./debug";
import { deepClone } from "./clone";

const log = {
  merge: debug("settings:merge"),
  conflict: debug("settings:conflict"),
  sync: debug("settings:sync"),
};

export type SyncTimestamp = {
  lastModified: number;
  lastSynced: number;
};

export type SyncMetadata = {
  version: number;
  deviceId: string;
} & SyncTimestamp;

export type SyncableSettings<T> = {
  data: T;
  metadata: SyncMetadata;
};

// Merge strategies
export enum MergeStrategy {
  LATEST_WINS = "latest_wins",
  CLIENT_WINS = "client_wins",
  SERVER_WINS = "server_wins",
  MANUAL_RESOLVE = "manual_resolve",
}

export interface ConflictResolutionOptions<T> {
  clientData: SyncableSettings<T>;
  serverData: SyncableSettings<T>;
  strategy: MergeStrategy;
  onManualResolve?: (conflict: {
    client: T;
    server: T;
    path: string[];
  }) => Promise<T>;
}

// Utility to compare timestamps and determine which version is newer
export function isNewer(a: SyncTimestamp, b: SyncTimestamp): boolean {
  return a.lastModified > b.lastModified;
}

// Deep compare two objects and find differences
export function findDifferences<T>(
  obj1: T,
  obj2: T,
  path: string[] = [],
): string[] {
  const differences: string[] = [];

  if (obj1 === obj2) return differences;
  if (typeof obj1 !== typeof obj2) {
    differences.push(path.join("."));
    return differences;
  }

  if (typeof obj1 !== "object" || obj1 === null || obj2 === null) {
    if (obj1 !== obj2) {
      differences.push(path.join("."));
    }
    return differences;
  }

  const keys = new Set([
    ...Object.keys(obj1 as object),
    ...Object.keys(obj2 as object),
  ]);

  for (const key of keys) {
    const val1 = (obj1 as any)[key];
    const val2 = (obj2 as any)[key];
    differences.push(...findDifferences(val1, val2, [...path, key]));
  }

  return differences;
}

// Merge settings with conflict resolution
export async function mergeSettings<T>({
  clientData,
  serverData,
  strategy,
  onManualResolve,
}: ConflictResolutionOptions<T>): Promise<SyncableSettings<T>> {
  log.merge("Merging settings with strategy:", strategy);

  const conflicts = findDifferences(clientData.data, serverData.data);
  if (conflicts.length === 0) {
    log.merge("No conflicts found, using latest version");
    return isNewer(clientData.metadata, serverData.metadata)
      ? clientData
      : serverData;
  }

  log.conflict("Found conflicts in paths:", conflicts);

  switch (strategy) {
    case MergeStrategy.LATEST_WINS:
      return isNewer(clientData.metadata, serverData.metadata)
        ? clientData
        : serverData;

    case MergeStrategy.CLIENT_WINS:
      return {
        data: clientData.data,
        metadata: {
          ...clientData.metadata,
          lastSynced: Date.now(),
        },
      };

    case MergeStrategy.SERVER_WINS:
      return {
        data: serverData.data,
        metadata: {
          ...serverData.metadata,
          lastSynced: Date.now(),
        },
      };

    case MergeStrategy.MANUAL_RESOLVE: {
      if (!onManualResolve) {
        throw new Error(
          "Manual resolve strategy requires onManualResolve callback",
        );
      }

      const resolvedData = deepClone(clientData.data);
      for (const conflictPath of conflicts) {
        const pathParts = conflictPath.split(".");
        const clientValue = getNestedValue(clientData.data, pathParts);
        const serverValue = getNestedValue(serverData.data, pathParts);

        const resolvedValue = await onManualResolve({
          client: clientValue,
          server: serverValue,
          path: pathParts,
        });

        setNestedValue(resolvedData, pathParts, resolvedValue);
      }

      return {
        data: resolvedData,
        metadata: {
          ...clientData.metadata,
          lastModified: Date.now(),
          lastSynced: Date.now(),
        },
      };
    }

    default:
      throw new Error(`Unknown merge strategy: ${strategy}`);
  }
}

// Utility function to get nested value from an object using path array
function getNestedValue<T>(obj: T, path: string[]): any {
  return path.reduce(
    (acc: any, key: string) => (acc ? acc[key] : undefined),
    obj,
  );
}

// Utility function to set nested value in an object using path array
function setNestedValue<T>(obj: T, path: string[], value: any): void {
  const lastKey = path.pop()!;
  const target = path.reduce((acc: any, key: string) => {
    if (!(key in acc)) {
      acc[key] = {};
    }
    return acc[key];
  }, obj);
  target[lastKey] = value;
}

// Create initial sync metadata
export function createSyncMetadata(deviceId: string): SyncMetadata {
  const timestamp = Date.now();
  return {
    version: 1,
    deviceId,
    lastModified: timestamp,
    lastSynced: timestamp,
  };
}

// Validate sync metadata
export function isValidSyncMetadata(metadata: any): metadata is SyncMetadata {
  return (
    metadata &&
    typeof metadata.version === "number" &&
    typeof metadata.deviceId === "string" &&
    typeof metadata.lastModified === "number" &&
    typeof metadata.lastSynced === "number"
  );
}

// Update sync metadata after successful sync
export function updateSyncMetadata(metadata: SyncMetadata): SyncMetadata {
  return {
    ...metadata,
    lastSynced: Date.now(),
  };
}
