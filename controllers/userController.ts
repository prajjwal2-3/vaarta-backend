import type { ServerWebSocket } from "bun";
import { usersOnline } from "..";

export function setUsersOnlineAndBroadcast( user: any, ws: ServerWebSocket) {
    usersOnline.set(user.id, ws)
    const onlineUsers = Array.from(usersOnline.entries())
    const message = JSON.stringify({
        type: "onlineUsers",
        users: onlineUsers
    })
    onlineUsers.forEach(({ "1": ws }) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(message)
        }
    })
}

export function sendTypingEvent(userIds: string[], ws: ServerWebSocket) {
    const onlineUsers = Array.from(usersOnline.entries());

    userIds.forEach((userId) => {
        const userToSend = onlineUsers.find(([id]) => id === userId);

        if (!userToSend) {
            console.warn(`User with ID ${userId} is not online.`);
            return;
        }

        const [, targetWs] = userToSend;
        if (targetWs.readyState === WebSocket.OPEN) {
            const message = JSON.stringify({
                type: 'typingEvent',
                userId,
            });
            targetWs.send(message);
            console.log(`Typing event sent to user: ${userId}`);
        } else {
            console.warn(`WebSocket for user ${userId} is not open.`);
        }
    });
}

