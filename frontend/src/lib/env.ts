export function getEnv<K extends keyof ImportMetaEnv>(key: K): ImportMetaEnv[K] {
  const value = import.meta.env[key];
  if (value === undefined) {
    throw new Error(`Environment variable ${key} is not defined`);
  }
  return value;
}
