# use-shared-sse

> 🔄 React hook to share a single Server-Sent Events (SSE) connection across multiple browser tabs using BroadcastChannel and Web Locks.

## ✨ Features

- 📡 Uses a single SSE connection across tabs
- 📢 Shares messages using `BroadcastChannel`
- 🔒 Ensures only one tab maintains the connection via `navigator.locks`
- ⚛️ Built with React hooks

## 📦 Installation

```bash
npm install use-shared-sse