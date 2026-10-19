import { useSyncExternalStore } from "react";

const noop = () => () => {};

/** true somente no cliente após a hidratação (evita divergência com o localStorage). */
export function useHydrated() {
  return useSyncExternalStore(noop, () => true, () => false);
}
