import { useEffect, useRef } from 'react';

interface UseServerEventsOptions {
  url: string | URL;
  options?: EventSourceInit;
  events: Array<{ name: string; cb: (event: MessageEvent) => void }>;
}

const defaultEventSourceInit: EventSourceInit = {
  withCredentials: true,
};

function useServerEvents({ url, options = defaultEventSourceInit, events }: UseServerEventsOptions) {
  const eventSource = useRef<EventSource | null>(null);
  const broadcastChannel = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    if (broadcastChannel.current === null) {
      broadcastChannel.current = new BroadcastChannel('sse-channel');
    }

    broadcastChannel.current.onmessage = ({ data: { name, data } }: MessageEvent) => {
      const handler = events.find((evt) => evt.name === name);
      return handler?.cb(data);
    };

    const channel = broadcastChannel.current;
    return () => {
      channel.close();
      broadcastChannel.current = null;
    };
  }, [events]);

  useEffect(() => {
    const broadcastedEvents = events.map((evt) => ({ ...evt, cb: withBroadcast(broadcastChannel.current!, evt) }));
    const { promise, resolve: resolveLock } = withResolvers();

    const controller = new AbortController();
    navigator.locks.request('sse-lock', { signal: controller.signal }, () => {
      eventSource.current = new EventSource(url, options);

      broadcastedEvents.forEach((evt) => eventSource.current?.addEventListener(evt.name, evt.cb));
      return promise; // Holding the lock for an arbitrary amount of time
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

function withBroadcast(channel: BroadcastChannel, event: { name: string; cb: (event: MessageEvent) => void }) {
  return (evt: MessageEvent) => {
    channel.postMessage({ name: event.name, data: evt.data });
    event.cb(evt.data);
  };
}

function withResolvers(): { promise: Promise<unknown>; resolve?: () => void; reject?: () => void } {
  let resolve, reject;

  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

export { useServerEvents };
