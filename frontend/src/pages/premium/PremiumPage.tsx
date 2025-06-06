import { premiumPlans } from "@/lib/premiumPlans";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Sparkles, CheckCircle2 } from "lucide-react";
import { axiosInstance } from "@/lib/axios";
import { toast } from "react-hot-toast";
import Topbar from "@/components/Topbar";

const PremiumPage = () => {
  const [selectedPlan, setSelectedPlan] = useState<keyof typeof premiumPlans | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!selectedPlan) {
      toast.error("Vui lòng chọn một gói trước.");
      return;
    }

    setLoading(true);
    try {
      const res = await axiosInstance.post("/payment/create-payment", { planId: selectedPlan });
      const { paymentUrl } = res.data;
      window.location.href = paymentUrl;
    } catch (err) {
      toast.error("Lỗi khi tạo thanh toán.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white px-4 py-10 flex justify-center">
      <div className="w-full max-w-3xl">
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <Sparkles className="text-purple-500" />
        Nâng cấp tài khoản Premium
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {Object.entries(premiumPlans).map(([key, plan]) => (
          <div
            key={key}
            onClick={() => setSelectedPlan(key as keyof typeof premiumPlans)}
            className={`relative rounded-xl border p-5 cursor-pointer transition-all duration-200 
              ${
                selectedPlan === key
                  ? "border-purple-500 bg-purple-900/30"
                  : "border-white/20 hover:border-purple-400 hover:bg-white/5"
              }`}
          >

            <h2 className="text-lg font-semibold mb-2">{plan.name}</h2>
            <p className="text-zinc-500 mb-4">{plan.days} ngày sử dụng</p>
            <p className="text-xl font-bold text-purple-600">{plan.price.toLocaleString()}đ</p>
            {selectedPlan === key && (
              <div className="mt-3 text-sm text-green-600 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Đã chọn
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-10 bg-gradient-to-br from-zinc-900 via-purple-900 to-black rounded-xl p-6 text-white shadow">
      <h3 className="text-lg font-semibold mb-4">🎁 Đặc quyền khi nâng cấp Premium:</h3>
      <ul className="grid sm:grid-cols-2 gap-4 text-sm">
        <li className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-yellow-400" />
          Kho nhạc Premium độc quyền
        </li>
        <li className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-yellow-400" />
          Nghe nhạc không quảng cáo
        </li>
        <li className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-yellow-400" />
          Nghe & tải nhạc Lossless chất lượng cao
        </li>
        <li className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-yellow-400" />
          Lưu trữ & playlist không giới hạn
        </li>
        <li className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-yellow-400" />
          Tính năng nghe nhạc nâng cao
        </li>
        <li className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-yellow-400" />
          Mở rộng khả năng Upload bài hát
        </li>
      </ul>
    </div>


      <div className="mt-8">
        <Button
          onClick={handleUpgrade}
          className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-6 py-3 text-sm font-semibold"
          disabled={loading}
        >
          {loading ? "Đang chuyển hướng..." : "Thanh toán & nâng cấp"}
        </Button>
      </div>
    </div>
    </div>
</div>
  );
};

export default PremiumPage;
