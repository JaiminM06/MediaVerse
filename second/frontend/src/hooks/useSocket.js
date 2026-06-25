import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const useSocket = (accessToken) => {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!accessToken) return;

    socketRef.current = io(
      import.meta.env.VITE_API_URL || 'http://localhost:8000',
      {
        auth: { token: accessToken },   // JWT must be in handshake auth
        withCredentials: true,
        transports: ['websocket']
      }
    );

    socketRef.current.on('connect', () => {
      console.log('Socket connected:', socketRef.current.id);
    });

    socketRef.current.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [accessToken]);

  return socketRef.current;
};

export default useSocket;
