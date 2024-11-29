import { connect, type ServerWebSocket } from "bun";
import { usersOnline } from "..";
import prisma from "../lib/prisma";
enum RoomType {
    SINGLE = 'SINGLE',
    GROUP = 'GROUP',
}
export function setUsersOnlineAndBroadcast(userId: string, ws: ServerWebSocket) {
    usersOnline.set(userId, ws)
    const onlineUsers = Array.from(usersOnline.entries())
    const message = JSON.stringify({
        type: "onlineUsers",
        users: onlineUsers.map(subArray=>subArray[0])
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

export async function createRoom(createdBy: string, users: string[], name: string, roomType: RoomType) {
    const onlineUsers = Array.from(usersOnline.entries());
    try {
        const newRoom = await prisma.room.create({
            data: {
                name,
                createdBy,
                users,
                roomType
            }
        })
        const userIdsInRoom = users
        userIdsInRoom.forEach((userId) => {
            const userToSend = onlineUsers.find(([id]) => id === userId);
            if (!userToSend) {
                console.warn(`User with ID ${userId} is not online.`);
                return;
            }
            const [, targetWs] = userToSend;
            if (targetWs.readyState === WebSocket.OPEN) {
                const message = JSON.stringify({
                    type: 'newRoom',
                    newRoom,
                });
                targetWs.send(message);
                console.log(`New room created and info sent: ${userId}`);
            } else {
                console.warn(`WebSocket for user ${userId} is not open.`);
            }
        })
      
        if (roomType==='SINGLE') {
            const friendId = users.filter((user) => user !== createdBy)
            const friend = await prisma.user.findUnique({
                where: {
                    id: friendId[0]
                }, select: {
                    image: true
                }
            })
            const newestRoom = await prisma.room.update({
                where: {
                    id: newRoom.id
                }, data:
                {
                    roomImage: friend?.image
                }
            })
        }

    } catch (err) {
        console.log('error creating a new room')
    }
}

export async function sendMessage(senderId: string, roomId: string, content: string) {
    const onlineUsers = Array.from(usersOnline.entries());
    try {
        const newMessage = await prisma.message.create({
            data: {
                content,
                senderId,
                roomId,
            }
        });
        const room = await prisma.room.findUnique({
            where: {
                id: roomId
            },
            select: {
                users: true
            }
        });
        if (!room) {
            console.warn(`Room with ID ${roomId} does not exist.`);
            return;
        }
        room.users.forEach((userId) => {
            const userToSend = onlineUsers.find(([id]) => id === userId);
            if (!userToSend) {
                console.warn(`User with ID ${userId} is not online.`);
                return;
            }

            const [, targetWs] = userToSend;
            if (targetWs.readyState === WebSocket.OPEN) {
                const message = JSON.stringify({
                    type: 'newMessage',
                    newMessage: {
                        id: newMessage.id,
                        content: newMessage.content,
                        senderId: newMessage.senderId,
                        createdAt: newMessage.createdAt,
                    },
                });
                targetWs.send(message);
                console.log(`New message created and sent to user: ${userId}`);
            } else {
                console.warn(`WebSocket for user ${userId} is not open.`);
            }
        });
    } catch (err) {
        console.error('Error sending message:', err);
    }
}
