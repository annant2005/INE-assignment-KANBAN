import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { presence } from '../clients/redis';

type Client = WebSocket & { userId?: string; boardId?: string; userName?: string };

export const initWebsocketServer = (httpServer: HttpServer) => {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  function broadcast(boardId: string, message: any, except?: Client) {
    const payload = JSON.stringify(message);
    for (const client of wss.clients as Set<Client>) {
      if (client.readyState === client.OPEN && client.boardId === boardId && client !== except) {
        client.send(payload);
      }
    }
  }

  // Broadcast board updates to all connected clients
  function broadcastBoardUpdate(boardId: string, update: any) {
    broadcast(boardId, { type: 'board_update', ...update });
  }

  // Broadcast card updates to all connected clients
  function broadcastCardUpdate(boardId: string, update: any) {
    broadcast(boardId, { type: 'card_update', ...update });
  }

  // Broadcast column updates to all connected clients
  function broadcastColumnUpdate(boardId: string, update: any) {
    broadcast(boardId, { type: 'column_update', ...update });
  }

  wss.on('connection', (socket: Client) => {
    socket.send(JSON.stringify({ type: 'welcome' }));

    socket.on('message', async (raw) => {
      try {
        const msg = JSON.parse(String(raw));
        
        if (msg.type === 'join') {
          socket.userId = msg.userId;
          socket.boardId = msg.boardId;
          socket.userName = msg.userName;
          
          if (socket.userId && socket.boardId) {
            await presence.setOnline(socket.userId, socket.boardId);
            const users = await presence.getBoardUsers(socket.boardId);
            broadcast(socket.boardId, { 
              type: 'presence', 
              users: users,
              userJoined: { userId: socket.userId, userName: socket.userName }
            });
          }
        }
        
        if (msg.type === 'typing' && socket.boardId) {
          broadcast(socket.boardId, { 
            type: 'typing', 
            userId: socket.userId, 
            userName: socket.userName,
            cardId: msg.cardId 
          }, socket);
        }
        
        if (msg.type === 'notify' && socket.boardId) {
          broadcast(socket.boardId, { 
            type: 'notify', 
            message: msg.message,
            from: socket.userName 
          });
        }

        // Handle real-time card movements
        if (msg.type === 'card_moved' && socket.boardId) {
          broadcastCardUpdate(socket.boardId, {
            cardId: msg.cardId,
            fromColumnId: msg.fromColumnId,
            toColumnId: msg.toColumnId,
            toPosition: msg.toPosition,
            movedBy: socket.userName
          });
        }

        // Handle real-time card updates
        if (msg.type === 'card_updated' && socket.boardId) {
          broadcastCardUpdate(socket.boardId, {
            cardId: msg.cardId,
            updates: msg.updates,
            updatedBy: socket.userName
          });
        }

        // Handle real-time column updates
        if (msg.type === 'column_updated' && socket.boardId) {
          broadcastColumnUpdate(socket.boardId, {
            columnId: msg.columnId,
            updates: msg.updates,
            updatedBy: socket.userName
          });
        }

        // Handle real-time board updates
        if (msg.type === 'board_updated' && socket.boardId) {
          broadcastBoardUpdate(socket.boardId, {
            boardId: msg.boardId,
            updates: msg.updates,
            updatedBy: socket.userName
          });
        }

      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    socket.on('close', async () => {
      if (socket.userId && socket.boardId) {
        await presence.setOffline(socket.userId, socket.boardId);
        const users = await presence.getBoardUsers(socket.boardId);
        broadcast(socket.boardId, { 
          type: 'presence', 
          users: users,
          userLeft: { userId: socket.userId, userName: socket.userName }
        });
      }
    });
  });

  return wss;
};
