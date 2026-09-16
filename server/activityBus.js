import { EventEmitter } from 'events';

// In-process pub/sub for the live activity feed. A single Node process is
// all this app runs as, so this is sufficient — a multi-instance deploy
// would need Postgres LISTEN/NOTIFY or Redis pub/sub instead.
export const activityBus = new EventEmitter();
activityBus.setMaxListeners(50);
