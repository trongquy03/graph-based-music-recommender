import { useAuthStore } from "@/stores/useAuthStore"
import Header from "./components/Header"
import DashboardStats from "./components/DashboardStats"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Album, Music, User } from "lucide-react"
import SongsTabContent from "./components/SongsTabContent"
import AlbumsTabContent from "./components/AlbumsTabContent"
import { useMusicStore } from "@/stores/useMusicStore"
import { useEffect } from "react"
import ArtistTabContent from "./components/ArtistTabContent"
import { useArtistStore } from "@/stores/useArtistStore"

const AdminPage = () => {
  const {isAdmin, isLoading} = useAuthStore()

  const {fetchAlbums, fetchSongs, fetchStats} = useMusicStore();
  const {fetchArtists} = useArtistStore();

  useEffect(() => {
    fetchArtists();
    fetchAlbums();
    fetchSongs();
    fetchStats();
  }, [isAdmin, isLoading])

  if (!isAdmin && !isLoading) return <div>Unauthorized</div>

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-900
   to-black text-zinc-100 p-8">
      <Header />

      <DashboardStats />

      <Tabs defaultValue="songs" className="space-y-6">
        <TabsList className="p-1 bg-zinc-800/50">

        <TabsTrigger value="songs" className="data-[state=active]:bg-zinc-700">
            <Music className="mr-2 size-4"/>
              Bài hát
          </TabsTrigger>

          <TabsTrigger value="artists" className="data-[state=active]:bg-zinc-700">
            <User className="mr-2 size-4" />
              Nghệ sĩ
          </TabsTrigger>

          
          <TabsTrigger value="albums" className="data-[state=active]:bg-zinc-700">
            <Album className="mr-2 size-4" />
              Albums
          </TabsTrigger>
          
        </TabsList>

        <TabsContent value="artists">
          <ArtistTabContent/>
        </TabsContent>

        <TabsContent value="songs">
          <SongsTabContent/>
        </TabsContent>

        <TabsContent value="albums">
          <AlbumsTabContent/>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AdminPage