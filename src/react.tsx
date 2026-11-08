import { type RefObject, useEffect, useRef } from "react";
import {
  type Petalfall as Instance,
  type PetalfallOptions,
  mount,
} from "petalfall";

export interface PetalfallProps extends PetalfallOptions {
  /** Fall inside this element instead of over the whole page. */
  target?: RefObject<HTMLElement | null>;
}

/** Everything that can be compared by value; functions are handled separately. */
function key(options: PetalfallOptions): string {
  const { grab, ...rest } = options;
  const grabData =
    typeof grab === "object" && grab
      ? { ...grab, isCovered: undefined, onGrab: undefined }
      : grab;
  return JSON.stringify({ ...rest, grab: grabData });
}

/**
 * Mounts petalfall for the life of the component. Renders nothing. Changing
 * the options updates the running instance; `onGrab` and `isCovered` can be
 * new functions every render without restarting anything.
 */
export function usePetalfall(
  options: PetalfallOptions,
  target?: RefObject<HTMLElement | null>,
) {
  const latest = useRef(options);
  latest.current = options;
  const instance = useRef<Instance | null>(null);

  // The functions always call the latest ones, so they never force an update.
  const bound = (): PetalfallOptions => {
    const grab = latest.current.grab;
    if (typeof grab !== "object" || !grab) return latest.current;
    return {
      ...latest.current,
      grab: {
        ...grab,
        isCovered: grab.isCovered
          ? (x, y) => {
              const g = latest.current.grab;
              return typeof g === "object" && g.isCovered
                ? g.isCovered(x, y)
                : false;
            }
          : undefined,
        onGrab: grab.onGrab
          ? (el) => {
              const g = latest.current.grab;
              if (typeof g === "object") g.onGrab?.(el);
            }
          : undefined,
      },
    };
  };

  useEffect(() => {
    instance.current = mount(target?.current, bound());
    return () => {
      instance.current?.destroy();
      instance.current = null;
    };
  }, [target]);

  const k = key(options);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    instance.current?.update(bound());
  }, [k]);
}

export function Petalfall({ target, ...options }: PetalfallProps) {
  usePetalfall(options, target);
  return null;
}

export type { PetalfallOptions } from "petalfall";
