import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Send, 
  Phone, 
  Video, 
  MoreVertical, 
  Search, 
  Plus,
  Users,
  Hash,
  Smile,
  Paperclip,
  Image
} from "lucide-react";
import Layout from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";

interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: Date;
  isOwn: boolean;
}

interface Conversation {
  id: string;
  name: string;
  type: 'direct' | 'group';
  lastMessage: string;
  timestamp: Date;
  unread: number;
  avatar?: string;
  online?: boolean;
  members?: number;
}

const Chat = () => {
  const { user } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<string | null>("1");
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const conversations: Conversation[] = [
    {
      id: "1",
      name: "Robotics Club",
      type: "group",
      lastMessage: "Hey everyone! Meeting tomorrow at 3 PM",
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      unread: 3,
      members: 45,
      avatar: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=150&h=150&fit=crop"
    },
    {
      id: "2",
      name: "Alice Johnson",
      type: "direct",
      lastMessage: "Thanks for the help with the project!",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      unread: 0,
      online: true,
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face"
    },
    {
      id: "3",
      name: "Programming Society",
      type: "group",
      lastMessage: "New hackathon announcement!",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
      unread: 1,
      members: 87,
      avatar: "https://images.unsplash.com/photo-1487058792275-0ad4472396825?w=150&h=150&fit=crop"
    },
    {
      id: "4",
      name: "Bob Smith",
      type: "direct",
      lastMessage: "See you at the event tonight!",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6),
      unread: 0,
      online: false,
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
    },
    {
      id: "5",
      name: "AI Research Group",
      type: "group",
      lastMessage: "Paper submission deadline reminder",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
      unread: 0,
      members: 23,
      avatar: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=150&h=150&fit=crop"
    }
  ];

  const messages: Record<string, Message[]> = {
    "1": [
      {
        id: "1",
        sender: "Alice Johnson",
        content: "Hey everyone! Just wanted to remind you about our meeting tomorrow at 3 PM in the engineering building.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60),
        isOwn: false
      },
      {
        id: "2",
        sender: "Bob Smith",
        content: "Thanks for the reminder! Should we bring our latest prototypes?",
        timestamp: new Date(Date.now() - 1000 * 60 * 45),
        isOwn: false
      },
      {
        id: "3",
        sender: user?.name || "You",
        content: "Absolutely! I'll bring the sensor array we've been working on.",
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        isOwn: true
      },
      {
        id: "4",
        sender: "Carol Davis",
        content: "Perfect! I'm excited to see everyone's progress. See you all tomorrow! 🤖",
        timestamp: new Date(Date.now() - 1000 * 60 * 15),
        isOwn: false
      }
    ],
    "2": [
      {
        id: "1",
        sender: "Alice Johnson",
        content: "Hi! Thanks so much for helping me with the database assignment yesterday.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
        isOwn: false
      },
      {
        id: "2",
        sender: user?.name || "You",
        content: "No problem at all! Happy to help. How did the submission go?",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
        isOwn: true
      },
      {
        id: "3",
        sender: "Alice Johnson",
        content: "It went great! I think I finally understand JOIN operations now 😄",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
        isOwn: false
      }
    ]
  };

  const currentConversation = conversations.find(c => c.id === selectedConversation);
  const currentMessages = selectedConversation ? messages[selectedConversation] || [] : [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages]);

  const handleSendMessage = () => {
    if (message.trim() && selectedConversation) {
      const newMessage: Message = {
        id: Date.now().toString(),
        sender: user?.name || "You",
        content: message.trim(),
        timestamp: new Date(),
        isOwn: true
      };
      
      // In a real app, this would be sent to the server
      console.log("Sending message:", newMessage);
      setMessage("");
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatLastSeen = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <Layout>
      <div className="h-screen bg-background pt-16">
        <div className="h-full flex">
          {/* Sidebar */}
          <div className="w-80 border-r border-border bg-card flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Messages</h2>
                <Button size="icon" variant="ghost">
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Conversations List */}
            <ScrollArea className="flex-1">
              <div className="p-2">
                {conversations
                  .filter(conv => 
                    conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => setSelectedConversation(conversation.id)}
                      className={`p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-accent/50 ${
                        selectedConversation === conversation.id ? 'bg-accent' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="relative">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={conversation.avatar} />
                            <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                              {conversation.type === 'group' ? (
                                <Users className="h-6 w-6" />
                              ) : (
                                conversation.name.split(' ').map(n => n[0]).join('')
                              )}
                            </AvatarFallback>
                          </Avatar>
                          {conversation.type === 'direct' && conversation.online && (
                            <div className="absolute bottom-0 right-0 h-3 w-3 bg-success rounded-full border-2 border-background" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium truncate">{conversation.name}</h4>
                              {conversation.type === 'group' && (
                                <Hash className="h-3 w-3 text-muted-foreground" />
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatLastSeen(conversation.timestamp)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-sm text-muted-foreground truncate">
                              {conversation.lastMessage}
                            </p>
                            {conversation.unread > 0 && (
                              <Badge variant="default" className="ml-2 min-w-[20px] h-5 text-xs">
                                {conversation.unread}
                              </Badge>
                            )}
                          </div>
                          {conversation.type === 'group' && conversation.members && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {conversation.members} members
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </ScrollArea>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedConversation && currentConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-border bg-card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={currentConversation.avatar} />
                        <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                          {currentConversation.type === 'group' ? (
                            <Users className="h-5 w-5" />
                          ) : (
                            currentConversation.name.split(' ').map(n => n[0]).join('')
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{currentConversation.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {currentConversation.type === 'group' 
                            ? `${currentConversation.members} members`
                            : currentConversation.online ? 'Online' : 'Offline'
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button size="icon" variant="ghost">
                        <Phone className="h-5 w-5" />
                      </Button>
                      <Button size="icon" variant="ghost">
                        <Video className="h-5 w-5" />
                      </Button>
                      <Button size="icon" variant="ghost">
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {currentMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            msg.isOwn
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          {!msg.isOwn && currentConversation.type === 'group' && (
                            <p className="text-xs font-medium text-primary mb-1">{msg.sender}</p>
                          )}
                          <p className="text-sm">{msg.content}</p>
                          <p className={`text-xs mt-1 ${
                            msg.isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                          }`}>
                            {formatTime(msg.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="p-4 border-t border-border bg-card">
                  <div className="flex items-center space-x-2">
                    <Button size="icon" variant="ghost">
                      <Paperclip className="h-5 w-5" />
                    </Button>
                    <Button size="icon" variant="ghost">
                      <Image className="h-5 w-5" />
                    </Button>
                    <div className="flex-1 relative">
                      <Input
                        placeholder="Type a message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        className="pr-10"
                      />
                      <Button size="icon" variant="ghost" className="absolute right-1 top-1/2 transform -translate-y-1/2">
                        <Smile className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button onClick={handleSendMessage} className="bg-gradient-hero">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
                  <p className="text-muted-foreground">Choose a conversation from the sidebar to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Chat;