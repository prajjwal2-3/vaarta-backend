import type { ServerWebSocket } from "bun";
import { sendTypingEvent, setUsersOnlineAndBroadcast } from "./controllers/userController";
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
      ws.send('connection open')
    },
    close() {
      console.log('connection closed')
    },
    async message(ws: ServerWebSocket, message: string) {
      const parsedMessage = JSON.parse(message)
      console.log(`message received ${message}`)
      switch (parsedMessage.type){
        case 'setMeOnline':
          setUsersOnlineAndBroadcast(parsedMessage.user,ws)
          break
        case 'iAmTyping':
  sendTypingEvent(parsedMessage.userId,ws)
  break
          
      }
      usersOnline.set(parsedMessage.user.id, ws)
    }
  },
});

console.log(`Server running at port ${server.port}`)