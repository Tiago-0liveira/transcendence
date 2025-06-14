import Database from "@db/Database";
import { connectedSocketClients } from "@api/websocket";

export async function handleIRCMessage(
  rawMessage: string
  senderID: number
): Promise<{ success: boolean; error?: string}> {
  try{
    const parsed = parseIRCMessage(rawMessage);
    if (!parsed) {
      return { success: false, error: `Command ${parsed.command} not allowed` };
    }
    const db = Database.getInstance();
    switch (parsed.command){
          case 'PRIVMSG':
            return await handlePrivateMessage(parsed, senderId, db);
          case 'ROOMMSG':
            return await handleRoomMessage(parsed, senderId, db);
          default:
              return { success: false, error: "Command not implemented" };
    }
  } catch(error){
    console.error("IRC handler error", error);
    return {success: false, error: "Internal server error"};
  }
}

//NOTE: add handler for individual commands
/

async function sendToUser(userdId: number, message: SocketMessage){
  const clientValue = connectedSocketClients.get(userdId);
  if(clientValue && clientValue.connceted && clientValue.socket){
    clientValue.socket.send(JSON.stringify(message));
  }
}
