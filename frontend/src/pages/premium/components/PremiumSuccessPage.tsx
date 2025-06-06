import { CheckCircle2 } from "lucide-react";
import { useEffect } from "react";
import { usePremiumStore } from "@/stores/usePremiumStore";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";

const PremiumSuccessPage = () => {
  const { fetchPremiumStatus } = usePremiumStore();
  const navigate = useNavigate();


  useEffect(() => {
    fetchPremiumStatus();
    const timer = setTimeout(() => {
      navigate("/"); // tự về trang chủ sau 2 giây
    }, 2000);

    return () => clearTimeout(timer);
  }, []);
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-gradient-to-br from-purple-800 via-black to-black p-8 rounded-xl shadow-lg text-center">
        <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Nâng cấp Premium thành công!</h1>
        <p className="text-zinc-400 mb-6">
          Cảm ơn bạn đã ủng hộ. Bạn đã mở khóa toàn bộ quyền lợi Premium 🎧
        </p>

        <Link to="/">
          <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-6 py-2">
            Về trang chủ
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default PremiumSuccessPage;
