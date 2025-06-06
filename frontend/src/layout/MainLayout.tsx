import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { Outlet } from "react-router-dom";
import LeftSidebar from "./components/LeftSidebar";
import AudioPlayer from "@/layout/components/AudioPlayer";
import PlaybackControls from "./components/PlaybackControls";
import { useEffect, useState } from "react";
import FriendsActivity from "./components/FriendsActivity";
import CommentPanel from "@/pages/comment/CommentPanel";

const MainLayout = () => {
    const [commentOpen, setCommentOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    
    useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth < 768);
		};

		checkMobile();
		window.addEventListener("resize", checkMobile);
		return () => window.removeEventListener("resize", checkMobile);
	}, []);

    useEffect(() => {
        const toggle = () => setCommentOpen(prev => !prev);
        document.addEventListener("toggle-comment-panel", toggle);
        return () => document.removeEventListener("toggle-comment-panel", toggle);
        }, []);
    return (
        <div className="h-screen bg-black text-white flex flex-col">
            {/* <Topbar/> */}
            <ResizablePanelGroup direction="horizontal" className="flex-1 flex h-full overflow-hidden p-2">
                <AudioPlayer/>
                {/* Left sidebar */}
                <ResizablePanel defaultSize={10} minSize={isMobile ?0:10} maxSize={25}>
                    <LeftSidebar />
                </ResizablePanel>

                <ResizableHandle className="w-2 bg-black rounded-lg transition-colors" />

                {/* Main content */}
                <ResizablePanel defaultSize={isMobile ? 80 : 60}>
                    <Outlet />
                </ResizablePanel>

                {!isMobile && (
                    <>
                    <ResizableHandle className=" bg-black rounded-lg transition-colors" />
                        {/* Right sidebar */}
                        {/* <ResizablePanel defaultSize={20} minSize={0} maxSize={25} collapsedSize={0}>
                            <FriendsActivity/>
                        </ResizablePanel> */}
                    </>
                )}

                {commentOpen && (
                <>
                    <ResizableHandle className="w-2 bg-black rounded-lg transition-colors" />
                    <ResizablePanel defaultSize={20} minSize={15} maxSize={25}>
                    <CommentPanel />
                    </ResizablePanel>
                </>
                )}



            </ResizablePanelGroup>

            <PlaybackControls />
        </div>
  )
}

export default MainLayout