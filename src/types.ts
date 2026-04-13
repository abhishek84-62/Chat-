export interface Message {
  id: string;
  from: string;
  to: string;
  content: string;
  type: "text" | "file" | "image";
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  timestamp: number;
  reactions?: Record<string, string[]>; // emoji -> uids[]
}

export interface User {
  uid: string;
  chatKey: string;
  displayName: string;
  photoURL?: string;
  qrCode: string;
  recoveryCode: string;
  connections: string[]; // uids
}

export interface ChatSession {
  id: string;
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
}
