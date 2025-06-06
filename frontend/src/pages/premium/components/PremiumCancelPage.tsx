import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const PremiumCancelPage = () => {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-gradient-to-br from-zinc-900 via-black to-black p-8 rounded-xl shadow text-center">
        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Giao dịch bị hủy</h1>
        <p className="text-zinc-400 mb-6">
          Bạn đã hủy thanh toán Premium. Nếu cần hỗ trợ hoặc muốn thử lại, bạn có thể quay lại bất kỳ lúc nào.
        </p>

        <div className="flex justify-center gap-4">
          <Link to="/">
            <Button variant="outline" className="rounded-full">
              Về trang chủ
            </Button>
          </Link>
          <Link to="/premium">
            <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-full">
              Thử lại nâng cấp
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PremiumCancelPage;
