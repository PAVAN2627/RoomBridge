import { useState, useEffect, useRef } from "react";
import UserDashboardLayout from "@/components/UserDashboardLayout";
import { Loader2, Send, Search, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams } from "react-router-dom";
import { listUserChats, setupChatListener, sendMessage, getChatSession } from "@/lib/firebase/chats";
import { getUser } from "@/lib/firebase/users";
import { ChatSessionDocument, MessageDocument, UserDocument } from "@/lib/firebase/types";
import { UserProfileModal } from "@/components/UserProfileModal";

interface ChatWithUser extends ChatSessionDocument {
  otherUser?: UserDocument;
  lastMessage?: string;
  unreadCount?: number;
}

const Messages = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const targetChatId = searchParams.get("chat");
  const [chats, setChats] = useState<ChatWithUser[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatWithUser | null>(null);
  const [messages, setMessages] = useState<MessageDocument[]>([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load user's chats
  useEffect(() => {
    if (!user) return;

    const loadChats = async () => {
      try {
        const userChats = await listUserChats(user.uid);
        
        // Fetch other user data for each chat
        const chatsWithUsers = await Promise.all(
          userChats.map(async (chat) => {
            const otherUserId = chat.participant_ids.find(id => id !== user.uid);
            if (!otherUserId) return chat;
            
            const otherUser = await getUser(otherUserId);
            return {
              ...chat,
              otherUser: otherUser || undefined,
            };
          })
        );

        setChats(chatsWithUsers);

        // Auto-select chat from URL param
        if (targetChatId) {
          const target = chatsWithUsers.find(c => c.chat_id === targetChatId);
          if (target) {
            setSelectedChat(target);
          } else {
            // Chat exists but isn't listed yet (just created) — fetch it directly
            const freshChat = await getChatSession(targetChatId);
            if (freshChat) {
              const otherUserId = freshChat.participant_ids.find(id => id !== user.uid);
              const otherUser = otherUserId ? await getUser(otherUserId) : undefined;
              const chatWithUser: ChatWithUser = { ...freshChat, otherUser: otherUser || undefined };
              setChats(prev => [chatWithUser, ...prev]);
              setSelectedChat(chatWithUser);
            }
          }
        }

        setLoading(false);
      } catch (error) {
        console.error("Error loading chats:", error);
        setLoading(false);
      }
    };

    loadChats();
  }, [user]);

  // Set up real-time listener for selected chat
  useEffect(() => {
    if (!selectedChat) return;

    const unsubscribe = setupChatListener(selectedChat.chat_id, (newMessages) => {
      setMessages(newMessages);
    });

    return () => unsubscribe();
  }, [selectedChat]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedChat || !user) return;

    setSending(true);
    try {
      await sendMessage(selectedChat.chat_id, user.uid, messageText.trim());
      setMessageText("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  const getTimeAgo = (timestamp: any) => {
    if (!timestamp) return "Just now";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };

  const filteredChats = chats.filter(chat => 
    chat.otherUser?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <UserDashboardLayout>
      <div className="h-[calc(100vh-8rem)]">
        <div className="grid lg:grid-cols-[380px_1fr] gap-6 h-full">
          {/* Conversations List */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-card rounded-2xl border border-border shadow-card overflow-hidden flex flex-col"
          >
            <div className="p-5 border-b border-border bg-gradient-to-r from-violet-500/5 to-purple-500/5">
              <h2 className="font-display text-xl font-bold text-foreground mb-3 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-violet-500" />
                Messages
              </h2>
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="relative"
              >
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-muted/50 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                />
              </motion.div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-12"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader2 className="w-8 h-8 text-primary" />
                  </motion.div>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-sm text-muted-foreground mt-3"
                  >
                    Loading conversations...
                  </motion.p>
                </motion.div>
              )}

              {!loading && filteredChats.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-12 px-4"
                >
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="mb-4"
                  >
                    <MessageCircle className="w-16 h-16 mx-auto text-muted-foreground/40" />
                  </motion.div>
                  <p className="text-sm text-muted-foreground">
                    {searchQuery ? "No conversations found" : "No messages yet"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Start chatting with room owners or seekers
                  </p>
                </motion.div>
              )}

              <AnimatePresence mode="popLayout">
                {!loading && filteredChats.map((chat, index) => (
                  <motion.button
                    key={chat.chat_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ x: 4, backgroundColor: "rgba(139, 92, 246, 0.05)" }}
                    onClick={() => setSelectedChat(chat)}
                    className={`w-full flex items-center gap-3 p-4 transition-colors text-left border-b border-border/50 ${
                      selectedChat?.chat_id === chat.chat_id ? "bg-violet-500/10" : ""
                    }`}
                  >
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="relative flex-shrink-0"
                    >
                      {chat.otherUser?.selfie_url ? (
                        <img
                          src={chat.otherUser.selfie_url}
                          alt={chat.otherUser.name}
                          className="w-12 h-12 rounded-full object-cover ring-2 ring-violet-500/20"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-base font-bold shadow-lg">
                          {chat.otherUser?.name?.charAt(0) || "U"}
                        </div>
                      )}
                      {chat.otherUser?.verification_badges && chat.otherUser.verification_badges.length > 0 && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-background"
                        >
                          <span className="text-white text-[10px]">✓</span>
                        </motion.div>
                      )}
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm text-foreground truncate">
                          {chat.otherUser?.name || "Unknown User"}
                        </span>
                        <span className="text-[10px] text-muted-foreground flex-shrink-0 ml-2">
                          {getTimeAgo(chat.last_message_at)}
                        </span>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Chat Area */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-card rounded-2xl border border-border shadow-card overflow-hidden flex flex-col"
          >
            {!selectedChat ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="flex-1 flex items-center justify-center"
              >
                <div className="text-center">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-4"
                  >
                    <Send className="w-10 h-10 text-violet-500" />
                  </motion.div>
                  <h3 className="font-display text-xl font-bold text-foreground mb-2">
                    Select a conversation
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Choose a chat from the list to start messaging
                  </p>
                </div>
              </motion.div>
            ) : (
              <>
                {/* Chat Header */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-5 border-b border-border flex items-center gap-4 bg-gradient-to-r from-violet-500/5 to-purple-500/5"
                >
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => setProfileUserId(
                      selectedChat.participant_ids.find((id) => id !== user?.uid) || null
                    )}
                    className="flex-shrink-0 transition-opacity"
                  >
                    {selectedChat.otherUser?.selfie_url ? (
                      <img
                        src={selectedChat.otherUser.selfie_url}
                        alt={selectedChat.otherUser.name}
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-violet-500/30"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-base font-bold shadow-lg">
                        {selectedChat.otherUser?.name?.charAt(0) || "U"}
                      </div>
                    )}
                  </motion.button>
                  <div className="flex-1">
                    <button
                      type="button"
                      onClick={() => setProfileUserId(
                        selectedChat.participant_ids.find((id) => id !== user?.uid) || null
                      )}
                      className="font-display font-bold text-base text-foreground hover:text-violet-500 transition-colors text-left"
                    >
                      {selectedChat.otherUser?.name || "Unknown User"}
                    </button>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {selectedChat.otherUser?.verification_badges && selectedChat.otherUser.verification_badges.length > 0 && (
                        <span className="text-green-500 flex items-center gap-1">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          Verified
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>

                {/* Messages */}
                <div className="flex-1 p-5 space-y-4 overflow-y-auto bg-gradient-to-b from-muted/10 to-transparent">
                  {messages.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center py-8"
                    >
                      <p className="text-sm text-muted-foreground">No messages yet</p>
                      <p className="text-xs text-muted-foreground mt-1">Start the conversation!</p>
                    </motion.div>
                  )}

                  <AnimatePresence mode="popLayout">
                    {messages.map((msg, index) => {
                      const isOwn = msg.sender_id === user?.uid;
                      return (
                        <motion.div
                          key={msg.message_id}
                          initial={{ opacity: 0, y: 20, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ delay: index * 0.02 }}
                          className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                        >
                          <div className={`max-w-[75%] ${isOwn ? "order-2" : "order-1"}`}>
                            <motion.div
                              whileHover={{ scale: 1.02 }}
                              className={`rounded-2xl px-4 py-3 shadow-sm ${
                                isOwn
                                  ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-tr-sm"
                                  : "bg-card border border-border text-foreground rounded-tl-sm"
                              }`}
                            >
                              <p className="text-sm leading-relaxed break-words">{msg.text}</p>
                            </motion.div>
                            <span
                              className={`text-[10px] text-muted-foreground block mt-1 ${
                                isOwn ? "text-right" : "text-left"
                              }`}
                            >
                              {formatTime(msg.timestamp)}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <motion.form
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  onSubmit={handleSendMessage}
                  className="p-5 border-t border-border flex gap-3 bg-gradient-to-r from-violet-500/5 to-purple-500/5"
                >
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type a message..."
                    disabled={sending}
                    className="flex-1 px-4 py-3 rounded-xl bg-muted/50 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all disabled:opacity-50"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={sending || !messageText.trim()}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Send
                  </motion.button>
                </motion.form>
              </>
            )}
          </motion.div>
        </div>
      </div>
      <UserProfileModal
        userId={profileUserId}
        open={!!profileUserId}
        onOpenChange={(open) => !open && setProfileUserId(null)}
      />
    </UserDashboardLayout>
  );
};

export default Messages;

