// Chat system functions
import { 
  doc, 
  setDoc, 
  updateDoc, 
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  Unsubscribe 
} from 'firebase/firestore';
import { db } from '../firebase';
import { ChatSessionDocument, MessageDocument } from './types';
import { validateParticipantIds } from './validation';

/**
 * Create a new chat session between two users
 * @param userId1 - First participant user ID
 * @param userId2 - Second participant user ID
 * @returns Promise resolving to the created chat session document
 */
export async function createChatSession(
  userId1: string,
  userId2: string
): Promise<ChatSessionDocument> {
  const participantIds: [string, string] = [userId1, userId2];
  
  // Validate participant IDs
  if (!validateParticipantIds(participantIds)) {
    throw new Error('Invalid participant IDs: must be exactly 2 unique user IDs');
  }
  
  // Check if chat already exists between these users
  const existingChat = await findChatBetweenUsers(userId1, userId2);
  if (existingChat) {
    return existingChat;
  }
  
  const chatRef = doc(collection(db, 'chats'));
  const chatId = chatRef.id;
  
  const now = Timestamp.now();
  
  const newChat: ChatSessionDocument = {
    chat_id: chatId,
    participant_ids: participantIds,
    status: 'active',
    created_at: now,
    last_message_at: now,
  };
  
  await setDoc(chatRef, newChat);
  return newChat;
}

/**
 * Find existing chat between two users
 * @param userId1 - First user ID
 * @param userId2 - Second user ID
 * @returns Promise resolving to chat session or null if not found
 */
export async function findChatBetweenUsers(
  userId1: string,
  userId2: string
): Promise<ChatSessionDocument | null> {
  const chatsRef = collection(db, 'chats');
  const q = query(
    chatsRef,
    where('participant_ids', 'array-contains', userId1)
  );
  
  const querySnapshot = await getDocs(q);
  
  for (const doc of querySnapshot.docs) {
    const chat = doc.data() as ChatSessionDocument;
    if (chat.participant_ids.includes(userId2)) {
      return chat;
    }
  }
  
  return null;
}

/**
 * Get a chat session by ID
 * @param chatId - Chat ID
 * @returns Promise resolving to the chat session or null if not found
 */
export async function getChatSession(chatId: string): Promise<ChatSessionDocument | null> {
  const chatRef = doc(db, 'chats', chatId);
  const chatSnap = await getDoc(chatRef);
  
  if (!chatSnap.exists()) {
    return null;
  }
  
  return chatSnap.data() as ChatSessionDocument;
}

/**
 * Get all chat sessions for a user
 * @param userId - User ID
 * @returns Promise resolving to array of chat sessions
 */
export async function listUserChats(userId: string): Promise<ChatSessionDocument[]> {
  const chatsRef = collection(db, 'chats');
  const q = query(
    chatsRef,
    where('participant_ids', 'array-contains', userId),
    orderBy('last_message_at', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as ChatSessionDocument);
}

/**
 * Send a message in a chat session
 * @param chatId - Chat ID
 * @param senderId - Sender user ID
 * @param text - Message text
 * @param messageType - Message type ('text' or 'system')
 * @returns Promise resolving to the created message document
 */
export async function sendMessage(
  chatId: string,
  senderId: string,
  text: string,
  messageType: 'text' | 'system' = 'text'
): Promise<MessageDocument> {
  const messagesRef = collection(db, 'chats', chatId, 'messages');
  const messageRef = doc(messagesRef);
  const messageId = messageRef.id;
  
  const now = Timestamp.now();
  
  const newMessage: MessageDocument = {
    message_id: messageId,
    sender_id: senderId,
    text,
    message_type: messageType,
    read_status: false,
    timestamp: now,
  };
  
  // Add message to subcollection
  await setDoc(messageRef, newMessage);
  
  // Update chat session's last_message_at + preview info for notifications
  const chatRef = doc(db, 'chats', chatId);
  await updateDoc(chatRef, {
    last_message_at: serverTimestamp(),
    last_message_sender_id: senderId,
    last_message_preview: text.length > 60 ? text.slice(0, 60) + '…' : text,
  });
  
  return newMessage;
}

/**
 * Mark a message as read
 * @param chatId - Chat ID
 * @param messageId - Message ID
 * @returns Promise resolving when update is complete
 */
export async function markMessageAsRead(
  chatId: string,
  messageId: string
): Promise<void> {
  const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
  
  await updateDoc(messageRef, {
    read_status: true,
  });
}

/**
 * Get messages from a chat session
 * @param chatId - Chat ID
 * @param limitCount - Maximum number of messages to retrieve (default 50)
 * @returns Promise resolving to array of messages
 */
export async function getMessages(
  chatId: string,
  limitCount: number = 50
): Promise<MessageDocument[]> {
  const messagesRef = collection(db, 'chats', chatId, 'messages');
  const q = query(
    messagesRef,
    orderBy('timestamp', 'desc'),
    limit(limitCount)
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as MessageDocument).reverse();
}

/**
 * Block a chat session
 * @param chatId - Chat ID
 * @param blockingUserId - User ID of the user blocking the chat
 * @returns Promise resolving when update is complete
 */
export async function blockChat(
  chatId: string,
  blockingUserId: string
): Promise<void> {
  const chatRef = doc(db, 'chats', chatId);
  const chatSnap = await getDoc(chatRef);
  
  if (!chatSnap.exists()) {
    throw new Error('Chat not found');
  }
  
  const chat = chatSnap.data() as ChatSessionDocument;
  const [user1, user2] = chat.participant_ids;
  
  let newStatus: ChatSessionDocument['status'];
  
  if (chat.status === 'active') {
    // First block
    newStatus = blockingUserId === user1 ? 'blocked_by_user1' : 'blocked_by_user2';
  } else if (chat.status === 'blocked_by_user1') {
    // Second block
    newStatus = blockingUserId === user2 ? 'blocked_by_both' : 'blocked_by_user1';
  } else if (chat.status === 'blocked_by_user2') {
    // Second block
    newStatus = blockingUserId === user1 ? 'blocked_by_both' : 'blocked_by_user2';
  } else {
    // Already blocked by both
    newStatus = 'blocked_by_both';
  }
  
  await updateDoc(chatRef, {
    status: newStatus,
  });
}

/**
 * Set up real-time listener for new messages in a chat
 * @param chatId - Chat ID
 * @param callback - Callback function to handle new messages
 * @returns Unsubscribe function to stop listening
 */
export function setupChatListener(
  chatId: string,
  callback: (messages: MessageDocument[]) => void
): Unsubscribe {
  const messagesRef = collection(db, 'chats', chatId, 'messages');
  const q = query(messagesRef, orderBy('timestamp', 'asc'));
  
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => doc.data() as MessageDocument);
    callback(messages);
  });
}
