"use client";

import { useState, useEffect } from "react";
import { useCommentStore } from "@/stores/useCommentStore";
import { useAuth, useUser } from "@clerk/clerk-react";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";
import { vi } from "date-fns/locale";

interface Props {
  songId: string;
}

const CommentPanelV2 = ({ songId }: Props) => {
  const { isSignedIn, userId } = useAuth();
  const { user } = useUser();
  const [text, setText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const {
    comments,
    fetchComments,
    addComment,
    updateComment,
    deleteComment,
  } = useCommentStore();

  useEffect(() => {
    if (songId) fetchComments(songId);
  }, [songId]);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    if (editingId) {
      await updateComment(editingId, text);
      setEditingId(null);
    } else {
      await addComment({ songId, text });
    }
    setText("");
  };

  const handleEdit = (id: string, oldText: string) => {
    setEditingId(id);
    setText(oldText);
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
    <div className="bg-zinc-900 rounded-md p-4 shadow-md mt-6 text-white">
      <h2 className="font-semibold text-lg mb-4">Bình luận</h2>

      {/* Danh sách bình luận */}
      <div className="space-y-4">
        {comments.map((c) => (
          <div key={c._id} className="flex items-start gap-3">
            <img
              src={c.user.imageUrl}
              alt={c.user.fullName}
              className="w-9 h-9 rounded-full object-cover"
            />
            <div className="bg-zinc-800 rounded-xl px-4 py-2 w-full">
              <div className="flex justify-between items-center">
                <span className="font-medium text-sm">{c.user.fullName}</span>
                <span className="text-xs text-zinc-400">
                  {formatDistanceToNowStrict(new Date(c.createdAt), {
                    locale: vi,
                    addSuffix: true,
                  })}
                </span>
              </div>
              <p className="text-sm text-zinc-300 mt-1 whitespace-pre-wrap">
                {editingId === c._id ? <em>(Đang chỉnh sửa)</em> : c.text}
              </p>

              {/* Nếu là của mình => hiện nút sửa/xoá */}
              {c.user.clerkId === userId && (
                <div className="flex gap-4 mt-2 text-xs text-zinc-400">
                  {editingId === c._id ? (
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setText("");
                      }}
                      className="hover:underline text-red-400"
                    >
                      Huỷ
                    </button>
                  ) : (
                    <button
                      onClick={() => handleEdit(c._id, c.text)}
                      className="hover:underline"
                    >
                      Sửa
                    </button>
                  )}
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

        {comments.length === 0 && (
          <p className="text-sm text-zinc-400 italic">Chưa có bình luận nào</p>
        )}
      </div>

      {/* Ô nhập bình luận */}
      {isSignedIn && user && (
        <div className="flex items-center mt-6 gap-3">
          <img
            src={user.imageUrl}
            alt={user.fullName || "user"}
            className="w-9 h-9 rounded-full object-cover"
          />
          <div className="relative w-full">
            <Input
              placeholder={
                editingId
                  ? "Chỉnh sửa bình luận..."
                  : `Bình luận dưới tên ${user.fullName || "bạn"}`
              }
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              className="pr-10 bg-zinc-800 text-white border border-zinc-700 placeholder:text-zinc-400 focus:ring-2 focus:ring-emerald-500"
            />
            <button
              onClick={handleSubmit}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-400 hover:text-emerald-300"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentPanelV2;
