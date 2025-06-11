interface ParsedIRCMessage{
  command: string;
  params: string[];
  content: string;
  target?: string;
  isPrivateMessage: boolean;
  isChannelMessage: boolean;
}

export function parseIRCMessage(rawMessage: string) parseIRCMessage(rawMessage) ParsedIRCMessage | null {
  //Basic IRC message format: COMMAND [params]: content
  //examples:
  // PRIVMSG #channel :Hello World
  // PRIVMSG username :Private messsage
  // JOIN #channel

  const trimmed = rawMessage.trim();
  if (!trimmed) return null;

  const parts = trimmed.split(' ');
  if (parts.length < 1) return null;

  const command = parts[0].toUpperCase();
  let params: string[] = [];
  let content = '';
  let target: string | undefined;

  const colonIndex = trimmed.indexOf(':');
  if (colonIndex !== -1){
    content = trimmed.substring(colonIndex + 1);
    params = trimmed.substring(command.length + 1, colonIndex).trim().split(' ').filter(p => p.length > 0);
  } else {
    params = parts.slice(1).filter(p => p.length > 0);
  }

  //Determine target for PRIVMSG
  if (command === 'PRIVMSG' && params.length > 0){
    target = params[0];
  }

  const isChannelMessage = target ? target.startsWith('#') : false;
  const isPrivateMessage = target ? !target.startsWith('#') : true;

  return {
    command,
    params,
    content,
    target,
    isPrivateMessage,
    isChannelMessage
  };

}

export function validateIRCCommand(command:string):boolean {
  const allowedCommands = ['PRIVMSG', 'JOIN', 'PART', 'QUIT', 'TOPIC'];
  return allowedCommands.includes(command.toUpperCase());
}
