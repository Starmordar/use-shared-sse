# use-shared-sse

![minzipped size](https://badgen.net/bundlephobia/minzip/use-shared-sse)
![Types](https://badgen.net/badge/TS/TypeScript/blue)
[![npm version](https://badgen.net/npm/v/use-shared-sse)](https://www.npmjs.com/package/use-shared-sse)
![License](https://badgen.net/npm/license/use-shared-sse)

> 🔄 React hook to share a single Server-Sent Events (SSE) connection across multiple browser tabs using BroadcastChannel and Web Locks.  
> ✅ Helps avoid browser HTTP/1.1 connection limits by ensuring only one active SSE connection across all tabs.

## 📦 Installation

```bash
npm install use-shared-sse
```

## 🚀 Quick Start

```tsx
import { useSse } from 'use-shared-sse';

function SseExample() {
  useSse({
    url: 'http://localhost:3005/sse',
    options: { withCredentials: true },
    events: [
      { name: 'ping', cb: onPingEvent },
      { name: 'hero', cb: onHeroReceiveEvent },
    ],
  });

  function onPingEvent(data: MessageEvent['data']) {
    console.log('Ping:', data);
  }

  function onHeroReceiveEvent(data: MessageEvent['data']) {
    console.log('Hero:', data);
  }

  return <></>;
}
```

## 📚 API Reference

### `useSse(options: UseSseOptions)`

React hook that manages a shared SSE connection across browser tabs using `BroadcastChannel` and `Web Locks`.

---

### `UseSseOptions`

| Field         | Type                                           | Required | Description |
|---------------|------------------------------------------------|----------|-------------|
| `url`         | `string \| URL`                                | ✅ Yes   | The URL to open the SSE connection to. |
| `options`     | `EventSourceInit`                              | No       | SSE configuration object. Default is `{ withCredentials: true }`. See [MDN docs](https://developer.mozilla.org/en-US/docs/Web/API/EventSource/EventSource#options). |
| `events`      | `{ name: string; cb: (event: MessageEvent) => void }[]` | ✅ Yes   | A list of event listeners, each with an event name and handler. |
| `channelName` | `string`                                       | No       | Custom name for the `BroadcastChannel`. Default: `"sse-channel"`. |
| `lockName`    | `string`                                       | No       | Custom name for the `Web Lock`. Default: `"sse-lock"`. |
