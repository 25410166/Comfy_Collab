import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

let socketInstance: Socket | null = null;

export function getSocket(): Socket {
  if (!socketInstance) {
    socketInstance = io(window.location.origin, {
      transports: ['websocket', 'polling']
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
