import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { useAuth } from "@/context/AuthContext"; // your auth context

const supabaseUrl = "https://vicodmtuupfklbxlriod.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpY29kbXR1dXBma2xieGxyaW9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5NjU4MDMsImV4cCI6MjA3MDU0MTgwM30.ZYpheNCF2P6H2dY-mJdN9_5oQ3-uEH7TFoBbKvpY8fs";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Conversation {
  id: string;
  name: string;
  type: "direct" | "group";
}

interface Message {
  id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  created_at: string;
}

const Chat = () => {
  const { user } = useAuth(); // user info from your auth context
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations where the logged-in user is participant
  const fetchConversations = async () => {
    const { data, error } = await supabase
      .from("conversation_participants")
      .select(`conversation:conversations(id, name, type)`)
      .eq("user_id", user.id);

    if (error) {
      console.error(error);
    } else if (data) {
      setConversations(data.flatMap((item) => item.conversation));
      if (
        data.length > 0 &&
        Array.isArray(data[0].conversation) &&
        data[0].conversation.length > 0 &&
        data[0].conversation[0].id
      )
        setSelectedConversation(data[0].conversation[0].id);
    }
  };

  // Fetch messages for selected conversation
  const fetchMessages = async (conversationId: string) => {
    const { data, error } = await supabase
      .from("messages")
      .select(`id, content, sender_id, created_at, sender_name`)
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error(error);
    } else {
      setMessages(data || []);
      scrollToBottom();
    }
  };

  // Scroll messages to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // On conversation change, load messages
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);

      // Setup realtime subscription for new messages in this conversation
      const subscription = supabase
        .channel(`messages:${selectedConversation}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${selectedConversation}`,
          },
          (payload) => {
            const newMsg = payload.new as Message;
            setMessages((prev) => [...prev, newMsg]);
            scrollToBottom();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [selectedConversation]);

  // Fetch conversations on mount
  useEffect(() => {
    if (user?.id) fetchConversations();
  }, [user]);

  // Send message handler
  const handleSendMessage = async () => {
    if (!message.trim() || !selectedConversation) return;

    const { error } = await supabase.from("messages").insert({
      conversation_id: selectedConversation,
      sender_id: user.id,
      sender_name: user.email, // using email as sender name
      content: message.trim(),
    });

    if (error) {
      console.error("Error sending message:", error);
    } else {
      setMessage("");
      // No need to manually update messages because real-time subscription will handle it
    }
  };

  return (
    <div className="chat-container">
      {/* Conversations sidebar */}
      <div className="sidebar">
        {conversations.map((conv) => (
          <div
            key={conv.id}
            onClick={() => setSelectedConversation(conv.id)}
            className={conv.id === selectedConversation ? "active" : ""}
          >
            {conv.name}
          </div>
        ))}
      </div>

      {/* Chat area */}
      <div className="chat-area">
        <div className="messages">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={msg.sender_id === user.id ? "message own" : "message"}
            >
              {msg.sender_id !== user.id && <b>{msg.sender_name}: </b>}
              <span>{msg.content}</span>
              <div className="timestamp">
                {new Date(msg.created_at).toLocaleTimeString()}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <input
          type="text"
          placeholder="Type a message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>
    </div>
  );
};

export default Chat;
