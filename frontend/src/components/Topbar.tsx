import { SignedOut, UserButton } from "@clerk/clerk-react";
import { LayoutDashboardIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuthStore } from "@/stores/useAuthStore";
import { Button, buttonVariants } from "./ui/button";
import { cn } from "@/lib/utils";

const Topbar = () => {
    const { isAdmin } = useAuthStore();
    console.log(isAdmin)

  return (
    <div className="flex items-center justify-between p-4 sticky top-0 bg-zinc-900/75
    backdrop-blur-md z-10
    ">
        <Link to="/">
        <div className="flex gap-2 items-center">
            <img src="/tunewise_logo.png" alt="TuneWise logo" className="size-8" />
            TuneWise
        </div>
        </Link>
        {/* Search bar */}
        <input
          type="text"
          placeholder="Tìm kiếm bài hát"
        //   value={searchQuery}
        //   onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 min-w-[200px] max-w-[400px] bg-zinc-800 text-white px-4 py-2 rounded-md outline-none border border-zinc-700 placeholder:text-zinc-400 text-base"
        />
        

        <div className="flex items-center gap-4">
            {isAdmin && (
                <Link to={"/admin"}
                className={cn(
                    buttonVariants({variant:"outline"})
                )}>
                    <LayoutDashboardIcon className="size-4 mr-2" />
                    Admin Dashboard
                </Link>
            )}
            {/* <ModeToggle /> */}
            <SignedOut>
              <Link to={"/login"}>
              <Button variant={"secondary"} className="w-full text-white border-zinc-200 h-11 cursor-pointer">
                Đăng nhập
             </Button></Link>
                
            </SignedOut>

            <UserButton />
        </div>
    </div>
  )
}

export default Topbar