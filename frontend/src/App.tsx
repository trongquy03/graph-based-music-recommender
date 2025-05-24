
import { Route, Routes } from "react-router-dom";
import HomePage from "./pages/home/HomePage";
import AuthCallbackPage from "./pages/auth-callback/AuthCallbackPage";
import { AuthenticateWithRedirectCallback } from "@clerk/clerk-react";
import MainLayout from "./layout/MainLayout";
import ChatPage from "./pages/chat/ChatPage";
import AlbumPage from "./pages/album/AlbumPage";
import AdminPage from "./pages/admin/AdminPage";

import { Toaster } from "react-hot-toast";
import NotFoundPage from "./pages/404/NotFoundPage";
import LoginPage from "./pages/login/LoginPage";
import LikedSongPage from "./pages/like/LikedSongPage";
import RecentlyPlayedPage from "./pages/recently/RecentlyPlayedPage";
import SearchPage from "./pages/search/SearchPage";
import ArtistPage from "./pages/artist/ArtistPage";
import ArtistDetailPage from "./pages/artist/ArtistDetailPage";
import ArtistSongsPage from "./pages/artist/components/ArtistSongsPage";

function App() {
  return (
    <>
    <Routes>
      <Route path="/sso-callback" element={<AuthenticateWithRedirectCallback signUpForceRedirectUrl={"/auth-callback"}/>} />
      <Route path="/auth-callback" element={<AuthCallbackPage/>} />
      <Route path="/admin" element={<AdminPage/>} />
      <Route path="/login" element={<LoginPage/>} />

      <Route element={<MainLayout/>}>
          <Route path="/" element={<HomePage/>} /> 
          <Route path="/chat" element={<ChatPage/>} />
          <Route path="/albums/:albumId" element={<AlbumPage/>} />
          <Route path="/artists" element={<ArtistPage/>} />
          <Route path="/artists/:artistId" element={<ArtistDetailPage/>} />
          <Route path="/artists/:artistId/songs" element={<ArtistSongsPage/>} />
          <Route path="/liked-songs" element={<LikedSongPage/>} />
          <Route path="/search" element={<SearchPage/>} />
          <Route path="/recently-played" element={<RecentlyPlayedPage/>} />
          <Route path="/*" element={<NotFoundPage/>} />
      </Route>
    </Routes>
    <Toaster/>
    </>
  );
}

export default App
