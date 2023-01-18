import type { ReadSignal } from 'maverick.js';
import { createEvent, setAttribute } from 'maverick.js/std';

import { useLogger } from '../../../foundation/logger/use-logger';
import { coerceToError } from '../../../utils/error';
import { resetPlaybackIfEnded, throwIfNotReadyForPlayback } from '../../media/provider/internal';
import type { MediaProviderAdapter } from '../../media/provider/types';
import { ATTEMPTING_AUTOPLAY } from '../../media/state';
import type { MediaStore } from '../../media/store';
import type { HTMLProviderElement } from './types';

/**
 * Adapts the underlying HTMLMediaElement API to satisfy the `MediaProviderAdapter` interface.
 */
export function useHTMLProviderAdapter(
  $target: ReadSignal<HTMLProviderElement | null>,
  $mediaElement: ReadSignal<HTMLMediaElement | null>,
  $media: MediaStore,
): MediaProviderAdapter {
  const logger = __DEV__ ? useLogger($mediaElement) : undefined;
  return {
    get paused() {
      return $mediaElement()?.paused ?? true;
    },
    get muted() {
      return $mediaElement()?.muted ?? false;
    },
    set muted(muted) {
      $mediaElement()!.muted = muted;
    },
    get volume() {
      return $mediaElement()?.volume ?? 1;
    },
    set volume(volume) {
      $mediaElement()!.volume = volume;
    },
    get currentTime() {
      return $mediaElement()?.currentTime ?? 0;
    },
    set currentTime(time) {
      $mediaElement()!.currentTime = time;
    },
    get playsinline() {
      return $mediaElement()?.hasAttribute('playsinline') ?? false;
    },
    set playsinline(playsinline) {
      setAttribute($mediaElement()!, 'playsinline', playsinline);
    },
    async play() {
      if (__DEV__) logger?.info('attempting to play...');
      try {
        throwIfNotReadyForPlayback($media);
        await resetPlaybackIfEnded($target()!, $media);
        return $mediaElement()!.play();
      } catch (error) {
        const provider = $target();

        if (provider) {
          const event = createEvent($target, 'play-fail');
          event.autoplay = $media[ATTEMPTING_AUTOPLAY];
          event.error = coerceToError(error);
          provider.dispatchEvent(event);
        }

        throw error;
      }
    },
    async pause() {
      if (__DEV__) logger?.info('attempting to pause...');
      return $mediaElement()?.pause();
    },
  };
}
