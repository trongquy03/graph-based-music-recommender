import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { usePlaylistStore } from "@/stores/usePlaylistStore";

interface Props {
  trigger: React.ReactNode;
}

const CreatePlaylistButton = ({ trigger }: Props) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [shuffle, setShuffle] = useState(true);
  const { createPlaylist, fetchPlaylists } = usePlaylistStore();

  const handleCreate = async () => {
    if (!name.trim()) return;
    await createPlaylist({ name, isPublic });
    await fetchPlaylists(); // Đảm bảo cập nhật danh sách
    setOpen(false);
    setName("");
    setIsPublic(true);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="bg-white text-black w-[360px] rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Tạo playlist mới</h2>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nhập tên playlist"
          className="mb-4"
        />

        <div className="flex items-center justify-between mb-3">
          <div>
            <Label htmlFor="isPublic" className="font-medium">
              Công khai
            </Label>
            <p className="text-sm text-gray-500">
              Mọi người có thể nhìn thấy playlist này
            </p>
          </div>
          <Switch
            id="isPublic"
            checked={isPublic}
            onCheckedChange={() => setIsPublic((prev) => !prev)}
          />
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <Label htmlFor="shuffle" className="font-medium">
              Phát ngẫu nhiên
            </Label>
            <p className="text-sm text-gray-500">
              Luôn phát ngẫu nhiên tất cả bài hát
            </p>
          </div>
          <Switch
            id="shuffle"
            checked={shuffle}
            onCheckedChange={() => setShuffle((prev) => !prev)}
          />
        </div>

        <Button
          onClick={handleCreate}
          disabled={!name.trim()}
          className="w-full bg-purple-600 text-white hover:bg-purple-500"
        >
          TẠO MỚI
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePlaylistButton;
