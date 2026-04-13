import React, { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { motion, AnimatePresence } from "motion/react";
import { 
  MessageSquare, 
  User as UserIcon, 
  Settings, 
  Plus, 
  Send, 
  Paperclip, 
  QrCode, 
  LogOut, 
  Copy, 
  Check,
  Search,
  MoreVertical,
  Smile,
  File as FileIcon,
  Download,
  Smartphone,
  Shield,
  Zap
} from "lucide-react";
import { GlassCard } from "./components/GlassCard";
import { NeonButton } from "./components/NeonButton";
import { QRCodeSVG } from "qrcode.react";
import CryptoJS from "crypto-js";
import { User, Message } from "./types";
import { cn } from "./lib/utils";

// Mock storage for demo purposes (since we are waiting for Firebase/MongoDB)
const LOCAL_STORAGE_KEY = "neon_chat_user";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [chatKey, setChatKey] = useState("");
  const [uidInput, setUidInput] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [activeTab, setActiveTab] = useState<"chats" | "profile" | "settings">("chats");
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [typing, setTyping] = useState<Record<string, boolean>>({});
  const [onlineStatus, setOnlineStatus] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showAddConnection, setShowAddConnection] = useState(false);
  const [newConnectionUid, setNewConnectionUid] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      // Ensure connections array exists
      if (!parsed.connections) parsed.connections = [];
      setUser(parsed);
    }
  }, []);

  useEffect(() => {
    if (user) {
      const newSocket = io();
      setSocket(newSocket);

      newSocket.on("connect", () => console.log("Socket connected as", user.uid));
      newSocket.on("connect_error", (err) => console.error("Socket connection error:", err));

      newSocket.emit("join", user.uid);

      newSocket.on("new_message", (msg: Message) => {
        setMessages((prev) => [...prev, msg]);
      });

      newSocket.on("user_typing", (data: { from: string, isTyping: boolean }) => {
        setTyping((prev) => ({ ...prev, [data.from]: data.isTyping }));
      });

      newSocket.on("user_status", (data: { uid: string, status: string }) => {
        setOnlineStatus((prev) => ({ ...prev, [data.uid]: data.status }));
      });

      return () => {
        newSocket.close();
      };
    }
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const generateUser = () => {
    if (chatKey.length !== 6) return;
    
    const uid = Math.random().toString(36).substring(2, 10).toUpperCase();
    const recoveryCode = Math.random().toString(36).substring(2, 14).toUpperCase();
    
    const newUser: User = {
      uid,
      chatKey,
      displayName: `User_${uid}`,
      qrCode: `neonchat://login?uid=${uid}&key=${chatKey}`,
      recoveryCode,
      connections: [],
    };
    
    setUser(newUser);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newUser));
  };

  const handleLogin = () => {
    // In a real app, we'd verify against a DB
    // For now, we'll just "login" if they provide a key
    if (chatKey.length === 6 && uidInput) {
      const newUser: User = {
        uid: uidInput,
        chatKey,
        displayName: `User_${uidInput}`,
        qrCode: `neonchat://login?uid=${uidInput}&key=${chatKey}`,
        recoveryCode: "RECOVERY_CODE",
        connections: [],
      };
      setUser(newUser);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newUser));
    }
  };

  const addConnection = () => {
    if (!newConnectionUid || !user) return;
    const updatedUser = {
      ...user,
      connections: [...new Set([...user.connections, newConnectionUid])]
    };
    setUser(updatedUser);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedUser));
    setNewConnectionUid("");
    setShowAddConnection(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedChat || !user || !socket) return;

    setUploading(true);
    setUploadProgress(0);

    // Mock upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prev + 5;
      });
    }, 100);

    try {
      // In a real app, we'd upload to Cloudinary here
      // For demo, we'll simulate a successful upload
      setTimeout(() => {
        clearInterval(interval);
        setUploadProgress(100);
        
        const msg: Message = {
          id: Date.now().toString(),
          from: user.uid,
          to: selectedChat,
          content: `Shared a file: ${file.name}`,
          type: file.type.startsWith("image/") ? "image" : "file",
          fileName: file.name,
          fileSize: file.size,
          fileUrl: URL.createObjectURL(file), // Temporary local URL
          timestamp: Date.now(),
        };

        socket.emit("send_message", msg);
        setUploading(false);
        setUploadProgress(0);
      }, 2000);
    } catch (error) {
      console.error("Upload failed", error);
      setUploading(false);
    }
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedChat || !socket || !user) return;

    const msg: Message = {
      id: Date.now().toString(),
      from: user.uid,
      to: selectedChat,
      content: newMessage,
      type: "text",
      timestamp: Date.now(),
    };

    socket.emit("send_message", msg);
    setNewMessage("");
  };

  const shareToWhatsApp = (msg: Message) => {
    const text = encodeURIComponent(`Check out this file from NEON CHAT: ${msg.content}\n${msg.fileUrl || ""}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <GlassCard className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-20 h-20 bg-neon-cyan/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-neon-cyan/50 shadow-[0_0_20px_rgba(0,243,255,0.3)]"
            >
              <Zap className="w-10 h-10 text-neon-cyan" />
            </motion.div>
            <h1 className="text-4xl font-black tracking-tighter neon-text-cyan">NEON CHAT</h1>
            <p className="text-white/50">Futuristic Real-time Communication</p>
          </div>

          <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
            <button 
              onClick={() => setIsLogin(true)}
              className={cn(
                "flex-1 py-2 rounded-lg transition-all",
                isLogin ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60"
              )}
            >
              Login
            </button>
            <button 
              onClick={() => setIsLogin(false)}
              className={cn(
                "flex-1 py-2 rounded-lg transition-all",
                !isLogin ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60"
              )}
            >
              Create
            </button>
          </div>

          <div className="space-y-4">
            {isLogin && (
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-white/40 ml-1">UID</label>
                <input 
                  type="text" 
                  placeholder="Enter your UID"
                  value={uidInput}
                  onChange={(e) => setUidInput(e.target.value.toUpperCase())}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-neon-cyan transition-colors"
                />
              </div>
            )}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-white/40 ml-1">6-Digit Chat Key</label>
              <input 
                type="password" 
                maxLength={6}
                placeholder="••••••"
                value={chatKey}
                onChange={(e) => setChatKey(e.target.value.replace(/\D/g, ""))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center text-2xl tracking-[1em] focus:outline-none focus:border-neon-cyan transition-colors"
              />
            </div>
          </div>

          <NeonButton 
            className="w-full"
            onClick={isLogin ? handleLogin : generateUser}
            disabled={chatKey.length !== 6 || (isLogin && !uidInput)}
          >
            {isLogin ? "ACCESS SYSTEM" : "GENERATE IDENTITY"}
          </NeonButton>

          <div className="text-center">
            <button 
              onClick={() => setShowQRScanner(!showQRScanner)}
              className="text-neon-pink text-sm font-bold hover:underline flex items-center justify-center gap-2 mx-auto"
            >
              <QrCode className="w-4 h-4" />
              Login via QR Scan
            </button>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Sidebar */}
      <div className="w-20 md:w-24 glass border-r border-white/10 flex flex-col items-center py-8 gap-8">
        <div className="w-12 h-12 bg-neon-cyan/20 rounded-xl flex items-center justify-center border border-neon-cyan/30">
          <Zap className="w-6 h-6 text-neon-cyan" />
        </div>
        
        <div className="flex-1 flex flex-col gap-6">
          <button 
            onClick={() => setActiveTab("chats")}
            className={cn(
              "p-3 rounded-2xl transition-all",
              activeTab === "chats" ? "bg-neon-cyan text-black shadow-[0_0_15px_rgba(0,243,255,0.5)]" : "text-white/40 hover:text-white/60"
            )}
          >
            <MessageSquare className="w-6 h-6" />
          </button>
          <button 
            onClick={() => setActiveTab("profile")}
            className={cn(
              "p-3 rounded-2xl transition-all",
              activeTab === "profile" ? "bg-neon-pink text-black shadow-[0_0_15px_rgba(255,0,255,0.5)]" : "text-white/40 hover:text-white/60"
            )}
          >
            <UserIcon className="w-6 h-6" />
          </button>
          <button 
            onClick={() => setActiveTab("settings")}
            className={cn(
              "p-3 rounded-2xl transition-all",
              activeTab === "settings" ? "bg-neon-purple text-black shadow-[0_0_15px_rgba(157,0,255,0.5)]" : "text-white/40 hover:text-white/60"
            )}
          >
            <Settings className="w-6 h-6" />
          </button>
        </div>

        <button 
          onClick={() => {
            localStorage.removeItem(LOCAL_STORAGE_KEY);
            setUser(null);
          }}
          className="p-3 rounded-2xl text-white/40 hover:text-red-500 transition-all"
        >
          <LogOut className="w-6 h-6" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === "chats" && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-1 overflow-hidden"
            >
              {/* Chat List */}
              <div className="w-full max-w-sm glass border-r border-white/10 flex flex-col">
                <div className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black tracking-tight">CHATS</h2>
                    <button 
                      onClick={() => setShowAddConnection(true)}
                      className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input 
                      type="text" 
                      placeholder="Search connections..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:border-neon-cyan transition-colors"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 space-y-2">
                  {/* Connection Items */}
                  {user.connections.length === 0 && (
                    <div className="text-center py-8 px-4">
                      <p className="text-xs text-white/20">No connections yet. Add someone using their UID.</p>
                    </div>
                  )}
                  {user.connections.map((uid) => (
                    <button 
                      key={uid}
                      onClick={() => setSelectedChat(uid)}
                      className={cn(
                        "w-full p-4 rounded-2xl flex items-center gap-4 transition-all",
                        selectedChat === uid ? "bg-neon-cyan/10 border border-neon-cyan/30" : "hover:bg-white/5"
                      )}
                    >
                      <div className="relative">
                        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
                          <UserIcon className="w-6 h-6 text-white/40" />
                        </div>
                        {onlineStatus[uid] === "online" && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#050505]" />
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-sm">{uid}</span>
                          <span className="text-[10px] text-white/40">12:45 PM</span>
                        </div>
                        <p className="text-xs text-white/40 truncate">
                          {typing[uid] ? "typing..." : "Encrypted message..."}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Window */}
              <div className="flex-1 flex flex-col bg-white/[0.02]">
                {selectedChat ? (
                  <>
                    <div className="p-6 glass border-b border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center border border-white/10">
                          <UserIcon className="w-5 h-5 text-white/40" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm">{selectedChat}</h3>
                          <span className="text-[10px] text-green-500 font-bold uppercase tracking-widest">
                            {onlineStatus[selectedChat] || "offline"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                          <Search className="w-5 h-5 text-white/40" />
                        </button>
                        <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                          <MoreVertical className="w-5 h-5 text-white/40" />
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                      {messages.filter(m => m.from === selectedChat || m.to === selectedChat).map((msg) => (
                        <div 
                          key={msg.id}
                          className={cn(
                            "flex flex-col max-w-[70%]",
                            msg.from === user.uid ? "ml-auto items-end" : "items-start"
                          )}
                        >
                          <div className={cn(
                            "p-4 rounded-2xl text-sm group relative",
                            msg.from === user.uid 
                              ? "bg-neon-cyan text-black font-medium rounded-tr-none" 
                              : "glass rounded-tl-none"
                          )}>
                            {msg.type === "text" ? (
                              msg.content
                            ) : (
                              <div className="space-y-2">
                                {msg.type === "image" ? (
                                  <img src={msg.fileUrl} alt="Shared" className="rounded-lg max-w-full h-auto" />
                                ) : (
                                  <div className="flex items-center gap-3 bg-black/20 p-3 rounded-xl">
                                    <FileIcon className="w-8 h-8 opacity-50" />
                                    <div className="flex-1 min-w-0">
                                      <p className="font-bold truncate text-xs">{msg.fileName}</p>
                                      <p className="text-[10px] opacity-50">{(msg.fileSize! / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                    <a href={msg.fileUrl} download={msg.fileName} className="p-2 hover:bg-white/10 rounded-lg">
                                      <Download className="w-4 h-4" />
                                    </a>
                                  </div>
                                )}
                                <p className="text-xs opacity-70 italic">{msg.content}</p>
                              </div>
                            )}
                            
                            <button 
                              onClick={() => shareToWhatsApp(msg)}
                              className="absolute -left-12 top-1/2 -translate-y-1/2 p-2 bg-green-500/20 text-green-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Send to WhatsApp"
                            >
                              <Zap className="w-4 h-4" />
                            </button>
                          </div>
                          <span className="text-[10px] text-white/30 mt-1">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>

                    {uploading && (
                      <div className="px-6 py-2">
                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${uploadProgress}%` }}
                            className="h-full bg-neon-cyan"
                          />
                        </div>
                        <p className="text-[10px] text-neon-cyan font-bold mt-1">UPLOADING FILE... {uploadProgress}%</p>
                      </div>
                    )}

                    <div className="p-6 glass border-t border-white/10">
                      <div className="flex items-center gap-4">
                        <input 
                          type="file" 
                          ref={fileInputRef}
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          className="p-2 text-white/40 hover:text-neon-cyan transition-colors"
                        >
                          <Paperclip className="w-6 h-6" />
                        </button>
                        <div className="flex-1 relative">
                          <input 
                            type="text" 
                            placeholder="Type a message..."
                            value={newMessage}
                            onChange={(e) => {
                              setNewMessage(e.target.value);
                              socket?.emit("typing", { from: user.uid, to: selectedChat, isTyping: true });
                            }}
                            onBlur={() => socket?.emit("typing", { from: user.uid, to: selectedChat, isTyping: false })}
                            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:outline-none focus:border-neon-cyan transition-colors"
                          />
                          <button className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-neon-cyan transition-colors">
                            <Smile className="w-5 h-5" />
                          </button>
                        </div>
                        <NeonButton 
                          variant="cyan" 
                          className="p-3 rounded-2xl"
                          onClick={sendMessage}
                        >
                          <Send className="w-6 h-6" />
                        </NeonButton>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4">
                    <div className="w-24 h-24 bg-white/5 rounded-3xl flex items-center justify-center border border-white/10 mb-4">
                      <MessageSquare className="w-12 h-12 text-white/20" />
                    </div>
                    <h3 className="text-2xl font-black tracking-tight text-white/40">SELECT A CHAT</h3>
                    <p className="text-white/20 max-w-xs">Choose a connection from the sidebar or add a new one to start messaging.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "profile" && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="flex-1 p-8 overflow-y-auto"
            >
              <div className="max-w-2xl mx-auto space-y-8">
                <h2 className="text-4xl font-black tracking-tighter neon-text-pink">IDENTITY</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <GlassCard className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-neon-pink/20 rounded-2xl flex items-center justify-center border border-neon-pink/30">
                        <UserIcon className="w-8 h-8 text-neon-pink" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{user.displayName}</h3>
                        <p className="text-white/40 text-sm">Active Identity</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Your UID</label>
                        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                          <code className="flex-1 font-mono text-neon-cyan">{user.uid}</code>
                          <button 
                            onClick={() => copyToClipboard(user.uid)}
                            className="text-white/40 hover:text-white transition-colors"
                          >
                            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Recovery Code</label>
                        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                          <code className="flex-1 font-mono text-white/60">••••••••••••</code>
                          <button className="text-white/40 hover:text-white transition-colors">
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </GlassCard>

                  <GlassCard className="flex flex-col items-center justify-center p-8 space-y-6">
                    <div className="p-4 bg-white rounded-2xl">
                      <QRCodeSVG value={user.qrCode} size={150} />
                    </div>
                    <div className="text-center space-y-2">
                      <h4 className="font-bold">QR IDENTITY</h4>
                      <p className="text-xs text-white/40">Scan to add connection or login on other devices</p>
                    </div>
                    <NeonButton variant="pink" className="w-full flex items-center justify-center gap-2">
                      <Download className="w-4 h-4" />
                      SAVE QR
                    </NeonButton>
                  </GlassCard>
                </div>

                <GlassCard className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Smartphone className="w-5 h-5 text-neon-cyan" />
                      CONNECTED DEVICES
                    </h3>
                    <span className="text-xs font-bold bg-neon-cyan/20 text-neon-cyan px-2 py-1 rounded">1 ACTIVE</span>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                          <Zap className="w-5 h-5 text-neon-cyan" />
                        </div>
                        <div>
                          <p className="font-bold text-sm">Chrome on Windows</p>
                          <p className="text-[10px] text-white/40">Current Device • Online</p>
                        </div>
                      </div>
                      <button className="text-xs font-bold text-red-500 hover:underline">LOGOUT</button>
                    </div>
                  </div>

                  <NeonButton variant="purple" className="w-full">LOGOUT ALL DEVICES</NeonButton>
                </GlassCard>
              </div>
            </motion.div>
          )}

          {activeTab === "settings" && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="flex-1 p-8 overflow-y-auto"
            >
              <div className="max-w-2xl mx-auto space-y-8">
                <h2 className="text-4xl font-black tracking-tighter neon-text-purple">SYSTEM</h2>
                
                <div className="space-y-6">
                  <GlassCard className="space-y-6">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Shield className="w-5 h-5 text-neon-purple" />
                      SECURITY
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-sm">End-to-End Encryption</p>
                          <p className="text-xs text-white/40">All messages are encrypted locally</p>
                        </div>
                        <div className="w-12 h-6 bg-neon-purple rounded-full relative">
                          <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-sm">File Expiry</p>
                          <p className="text-xs text-white/40">Automatically delete shared files after 24h</p>
                        </div>
                        <div className="w-12 h-6 bg-white/10 rounded-full relative">
                          <div className="absolute left-1 top-1 w-4 h-4 bg-white/40 rounded-full" />
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/10">
                      <button className="text-neon-pink font-bold text-sm hover:underline">Reset Chat Key</button>
                    </div>
                  </GlassCard>

                  <GlassCard className="space-y-6">
                    <h3 className="text-xl font-bold">WHATSAPP SYNC</h3>
                    <p className="text-xs text-white/40">Connect your WhatsApp to sync messages across platforms.</p>
                    <NeonButton variant="cyan" className="w-full">CONNECT WHATSAPP</NeonButton>
                    <p className="text-[10px] text-red-500/60 text-center italic">Warning: Experimental feature. Use with caution to avoid number ban.</p>
                  </GlassCard>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Add Connection Modal */}
      <AnimatePresence>
        {showAddConnection && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <GlassCard className="w-full max-w-sm space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">ADD CONNECTION</h3>
                  <button onClick={() => setShowAddConnection(false)} className="text-white/40 hover:text-white">
                    <Plus className="w-6 h-6 rotate-45" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Enter UID</label>
                    <input 
                      type="text" 
                      placeholder="e.g. A1B2C3D4"
                      value={newConnectionUid}
                      onChange={(e) => setNewConnectionUid(e.target.value.toUpperCase())}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-neon-cyan transition-colors"
                    />
                  </div>
                  <NeonButton className="w-full" onClick={addConnection}>ESTABLISH LINK</NeonButton>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
