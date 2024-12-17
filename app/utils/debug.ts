const isClient = typeof window !== "undefined";

export function debug(namespace: string) {
  return (...args: any[]) => {
    if (isClient && !localStorage.getItem("debug")) return;

    console.log(
      `%c[${namespace}]`,
      "color: #8B5CF6; font-weight: bold",
      ...args,
    );
  };
}
