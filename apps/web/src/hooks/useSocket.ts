import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

let socketInstance: Socket | null = null;

export function getSocket(): Socket {
  if (!socketInstance) {
    // When running in dev mode on port 2000, connect directly to backend on port 2001 to bypass Vite WS proxy
    const socketUrl = window.location.port === '2000'
      ? `${window.location.protocol}//${window.location.hostname}:2001`
      : window.location.origin;

    socketInstance = io(socketUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1500
    });
  }
  return socketInstance;
}


export function useSocketEvent(event: string, callback: (data: any) => void) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const socket = getSocket();
    const handler = (data: any) => {
      if (callbackRef.current) {
        callbackRef.current(data);
      }
    };

    socket.on(event, handler);
    return () => {
      socket.off(event, handler);
    };
  }, [event]);
}
