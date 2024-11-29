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
    close() {
      console.log('connection closed')
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