import { useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

let globalSocket: Socket | null = null;

/**
 * Get or create the global socket instance.
 * Returns null if not connected yet.
 */
export function getSocket(): Socket | null {
  if (!globalSocket?.connected) {
    return null;
  }
  return globalSocket;
}

/**
 * Set the global socket instance (called by useSocket hook).
 */
export function setGlobalSocket(socket: Socket | null) {
  globalSocket = socket;
}

/**
 * Safe emit pattern with automatic acknowledgement timeout.
 * Usage: await emitEvent('cursor-move', { workspaceId, x, y })
 */
export function useSocketEmit() {
  const emit = useCallback(
    <T = any>(
      event: string,
      data: any,
      options?: { timeout?: number; fallback?: T }
    ): Promise<T | null> => {
      return new Promise((resolve) => {
        const socket = getSocket();
        if (!socket) {
          resolve(options?.fallback ?? null);
          return;
        }

        const timeout = options?.timeout ?? 5000;
        const timer = setTimeout(() => {
          console.warn(`Event [${event}] timed out after ${timeout}ms`);
          resolve(options?.fallback ?? null);
        }, timeout);

        socket.emit(event, data, (ack: T) => {
          clearTimeout(timer);
          resolve(ack);
        });
      });
    },
    []
  );

  return { emit };
}
