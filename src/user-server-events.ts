import { useEffect, useRef } from 'react';

/**
 * Configuration options for the `useSse` hook.
 */
interface UseSseOptions {
  /**
   * A string that represents the location of the remote resource serving the events/messages.
   */
  url: string | URL;

  /**
   * Provides options to configure the new connection. 
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/EventSource/EventSource#options | EventSource options on MDN}
   */
  options?: EventSourceInit;

  /**
   * A list of server-sent events to subscribe to, each with a name and a corresponding callback.
   */
  events: Array<{
    /**
     * Name of the event to listen for on the SSE connection.
     */
    name: string;

    /**
     * Callback function that handles the received SSE message.
     */
    cb: (event: MessageEvent) => void;
  }>;

  /**
   * Optional custom name for the BroadcastChannel used for cross-tab communication.
   * Defaults to "sse-channel".
   */
  channelName?: string;

  /**
   * Optional custom name for the Web Lock used to prevent duplicate connections.
   * Defaults to "sse-lock".
   */
  lockName?: string;
}

/**
 * This hook manages a single SSE connection across browser tabs using BroadcastChannel 
 * and Web Locks to prevent duplicate connections and synchronize events.
 *
 * @param options - Configuration for setting up the SSE connection. See `UseSseOptions`.
 * @param options.url
 * @param options.options 
 * @param options.events
 * @param options.channelName
 * @param options.lockName
 */
function useSse({ 
  url, 
  options = { withCredentials: true }, 
  events,
  channelName = 'sse-channel', 
  lockName = 'sse-lock' 
}: UseSseOptions) {
  const eventSource = useRef<EventSource | null>(null);
  const broadcastChannel = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    if (broadcastChannel.current === null) {
      broadcastChannel.current = new BroadcastChannel(channelName);
    }

    broadcastChannel.current.onmessage = ({ data: { name, data } }: MessageEvent) => {
      const handler = events.find((evt) => evt.name === name);
      return handler?.cb(data);
    };

    return () => {
      broadcastChannel.current?.close();
      broadcastChannel.current = null;
    };
  }, [events]);

  useEffect(() => {
    const broadcastedEvents = events.map((evt) => ({ ...evt, cb: withBroadcast(broadcastChannel.current!, evt) }));
    const { promise, resolve: resolveLock } = withResolvers();

    const controller = new AbortController();
    navigator.locks.request(lockName, { signal: controller.signal }, () => {
      eventSource.current = new EventSource(url, options);

      broadcastedEvents.forEach((evt) => eventSource.current?.addEventListener(evt.name, evt.cb));
      return promise;
    });

    return () => {
      controller.abort();

      if (!eventSource.current) return;
      broadcastedEvents.forEach((evt) => eventSource.current?.removeEventListener(evt.name, evt.cb));
      eventSource.current?.close();
      eventSource.current = null;
      resolveLock?.();
    };
  }, [url, options, events]);
}

/**
 * Wraps a message event handler so it also broadcasts the event to other tabs.
 */
function withBroadcast(channel: BroadcastChannel, event: { name: string; cb: (event: MessageEvent) => void }) {
  return (evt: MessageEvent) => {
    channel.postMessage({ name: event.name, data: evt.data });
    event.cb(evt.data);
  };
}

/**
 * Creates a promise along with externally accessible `resolve` and `reject` functions. *
 */
function withResolvers(): { promise: Promise<unknown>; resolve?: () => void; reject?: () => void } {
  let resolve, reject;

  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

export { useSse };
