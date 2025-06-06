import { useState, useEffect } from "react";
import { Minus, Send } from "lucide-react";
import { useCommentStore } from "@/stores/useCommentStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@clerk/clerk-react";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { formatDistanceToNowStrict } from "date-fns";
import { vi } from "date-fns/locale";

const CommentPanel = () => {
  const [text, setText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const {
    comments,
    fetchComments,
    addComment,
    updateComment,
    deleteComment,
  } = useCommentStore();
  const { userId, isSignedIn } = useAuth();
  const { currentSong } = usePlayerStore();

  useEffect(() => {
    if (currentSong) fetchComments(currentSong._id);
  }, [currentSong]);

  const handleSubmit = async () => {
    if (!text.trim() || !currentSong) return;
    if (editingId) {
      await updateComment(editingId, text);
      setEditingId(null);
    } else {
      await addComment({ songId: currentSong._id, text });
    }
    setText("");
  };

  const handleEdit = (id: string, oldText: string) => {
    setEditingId(id);
    setText(oldText);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setText("");
  };

  const handleDelete = async (id: string) => {
    if (confirm("Bạn có chắc muốn xoá bình luận này?")) {
      await deleteComment(id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="h-full bg-zinc-900 rounded-lg flex flex-col">
      <div className="p-4 flex justify-between items-center border-b border-zinc-800">
        <h2 className="text-white font-semibold">{comments.length} bình luận</h2>
        <button
          className="text-zinc-400 hover:text-white"
          onClick={() => {
            document.dispatchEvent(new CustomEvent("toggle-comment-panel"));
          }}
        >
          <Minus />
        </button>
      </div>

      <ScrollArea className="flex-1 p-4 space-y-6">
        {comments.length === 0 && (
          <p className="text-zinc-400 text-sm">Chưa có bình luận nào</p>
        )}
        {comments.map((c) => (
          <div key={c._id} className="flex items-start gap-3">
            <img
              src={c.user.imageUrl}
              alt={c.user.fullName}
              className="w-9 h-9 rounded-full object-cover"
            />
            <div className="flex-1">
              <div className="bg-zinc-800 p-3 rounded-2xl">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm text-white leading-tight">
                    {c.user.fullName}
                  </p>
                  <span className="text-xs text-zinc-400">
                    {formatDistanceToNowStrict(new Date(c.createdAt), { locale: vi })}
                  </span>
                </div>
                <p className="text-sm text-zinc-300 whitespace-pre-wrap">
                  {editingId === c._id ? <em>(Đang chỉnh sửa)</em> : c.text}
                </p>
              </div>
              {userId === c.user.clerkId && (
                <div className="flex gap-4 mt-1 text-xs text-zinc-400 pl-2">
                  <button
                    onClick={() => handleEdit(c._id, c.text)}
                    className="hover:underline"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(c._id)}
                    className="hover:underline"
                  >
                    Xoá
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </ScrollArea>

      {isSignedIn && currentSong && (
        <div className="p-4 border-t border-zinc-700">
          <div className="relative">
            <Input
              placeholder={editingId ? "Chỉnh sửa bình luận..." : "Nhập bình luận..."}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pr-10"
            />
            <button
              onClick={handleSubmit}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:text-emerald-400"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentPanel;
