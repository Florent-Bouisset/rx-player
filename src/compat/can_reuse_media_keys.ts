// import { isA1KStb40xx, isPanasonic, isPhilipsNetTv, isWebOs } from "./browser_detection";

/**
 * Returns `true` if a `MediaKeys` instance (the  `Encrypted Media Extension`
 * concept) can be reused between contents.
 *
 * This should usually be the case but we found rare devices where this would
 * cause problem:
 *   - (2022-11-21): WebOS (LG TVs), for some encrypted contents, just
 *     rebuffered indefinitely when loading a content already-loaded on the
 *     HTMLMediaElement.
 *   - (2024-08-23): Seen on Philips 2024 and 2023 in:
 *     https://github.com/canalplus/rx-player/issues/1464
 *   - (2024-09-04): Another case seen on an "A1" set-top box model made by
 *     Kaonmedia we will call the KSTB40xx.
 *     It may share the problematic with other devices, but we have only seen
 *     the problem on this one for now.
 *
 * @returns {boolean}
 */
export default function canReuseMediaKeys(): boolean {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, no-restricted-properties, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
  if ((window as any)._RENEW_MEDIA_KEYS === undefined) {
    return false;
  } else {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, no-restricted-properties, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
    return !Boolean((window as any)._RENEW_MEDIA_KEYS);
  }
}
