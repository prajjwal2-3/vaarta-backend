import type { ServerWebSocket } from "bun";
import { sendTypingEvent, setUsersOnlineAndBroadcast ,createRoom,sendMessage} from "./controllers/userController";
export const usersOnline = new Map<string, ServerWebSocket>()
const server = Bun.serve({
  port: Bun.env.port,
  fetch(req, server) {
    const url = new URL(req.url);
    if (url.pathname === "/chat") {
      const upgraded = server.upgrade(req);
      if (!upgraded) {
        return new Response("Upgrade failed", { status: 400 });
      }
    }
    if (req.method === 'GET') {
      return new Response('hi user prajjwal, new watch, new new')
    }
  },
  websocket: {
    open(ws: ServerWebSocket<unknown>) {
      console.log('connection open')
    },
    close(ws: ServerWebSocket<unknown>) {
      console.log('connection closed');
      for (const [userId, userWs] of usersOnline.entries()) {
        if (userWs === ws) {
          usersOnline.delete(userId);
          console.log(`User ${userId} removed from online users.`);
          break;
        }
      }
      const onlineUsers = Array.from(usersOnline.entries())
      const message = JSON.stringify({
        type: "onlineUsers",
        users: onlineUsers.map(subArray => subArray[0])
      })
      onlineUsers.forEach(({ "1": ws }) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message)
        }
      })
    },
    async message(ws: ServerWebSocket, message: string) {
      const parsedMessage = JSON.parse(message)
      console.log(`message received ${message}`)
      switch (parsedMessage.type) {
        case 'setMeOnline':
          setUsersOnlineAndBroadcast(parsedMessage.userId, ws)
          break
        case 'iAmTyping':
          sendTypingEvent(parsedMessage.userIds, ws)
          break
        case 'createRoom':
          createRoom(parsedMessage.createdBy,parsedMessage.users,parsedMessage.name,parsedMessage.roomType)
          break
        case 'sendMessage':
          sendMessage(parsedMessage.senderId,parsedMessage.roomId,parsedMessage.content)
          break
      }
    }
  },
});

console.log(`Server running at port ${server.port}`)