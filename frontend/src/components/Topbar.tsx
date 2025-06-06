import { useEffect } from "react";
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import {
  LayoutDashboardIcon,
  Sparkles,
  CalendarDays,
  Crown,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuthStore } from "@/stores/useAuthStore";
import { Button, buttonVariants } from "./ui/button";
import { cn } from "@/lib/utils";
import { SearchBox } from "@/pages/search/components/SearchBox";
import { usePremiumStore } from "@/stores/usePremiumStore";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { vi } from "date-fns/locale";


const Topbar = () => {
  const { isAdmin } = useAuthStore();
  const {
    isPremium,
    premiumUntil,
    fetchPremiumStatus,
  } = usePremiumStore();

  useEffect(() => {
    fetchPremiumStatus();
  }, []);

  return (
    <div
      className="flex items-center justify-between p-4 sticky top-0 bg-zinc-900/75
    backdrop-blur-md z-10"
    >
      <Link to="/">
        <div className="flex gap-2 items-center">
          <img src="/tunewise_logo.png" alt="TuneWise logo" className="size-8" />
          TuneWise
        </div>
      </Link>

      <div className="w-full max-w-md mx-4">
        <SearchBox />
      </div>

      <div className="flex items-center gap-4">
       <SignedIn>
  {!isPremium ? (
    <Button
      onClick={() => window.open("/premium", "_blank")}
      className="bg-purple-500 hover:bg-purple-600 text-white rounded-full h-10 px-5 text-sm font-semibold"
    >
      <Sparkles className="w-4 h-4 mr-2" />
      Nâng cấp tài khoản
    </Button>
  ) : (
    <Popover>
      <PopoverTrigger asChild>
        <Button className="bg-yellow-400 hover:bg-yellow-300 text-white rounded-full h-10 px-5 text-sm font-semibold">
          <Crown className="w-4 h-4" />
          VIP 
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 bg-black text-white border border-zinc-800">
        <div className="text-sm">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="text-yellow-400 w-5 h-5" />
            <span>
              Gói hiện tại: VIP
            </span>
          </div>
          <div className="flex items-center gap-2 text-zinc-400 text-sm">
            <CalendarDays className="w-4 h-4" />
            Hết hạn:{" "}
            {premiumUntil
              ? format(new Date(premiumUntil), "dd/MM/yyyy", { locale: vi })
              : "Không rõ"}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )}
</SignedIn>


        {isAdmin && (
          <Link
            to={"/admin"}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            <LayoutDashboardIcon className="size-4 mr-2" />
            Admin Dashboard
          </Link>
        )}

        <SignedOut>
          <Link to={"/login"}>
            <Button
              variant={"secondary"}
              className="w-full text-white border-zinc-200 h-11 cursor-pointer"
            >
              Đăng nhập
            </Button>
          </Link>
        </SignedOut>

        <UserButton />
      </div>
    </div>
  );
};

export default Topbar;
