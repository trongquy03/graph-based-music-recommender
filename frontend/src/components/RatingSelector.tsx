import { Star } from "lucide-react";

interface Props {
  current: number;
  onSelect: (value: number) => void;
  onClear?: () => void;
}

const RatingSelector = ({ current, onSelect, onClear }: Props) => {
  return (
    <div className="bg-zinc-800 p-2 rounded shadow-md z-50 flex flex-col items-center">
      <div className="flex gap-1 mb-2">
        {[1, 2, 3, 4, 5].map((val) => (
          <Star
            key={val}
            size={18}
            onClick={() => onSelect(val)}
            className={`cursor-pointer transition-transform hover:scale-110 ${
              val <= current ? "fill-yellow-400 text-yellow-400" : "text-zinc-500"
            }`}
          />
        ))}
      </div>
      {current > 0 && (
        <button
          onClick={onClear}
          className="text-sm text-red-400 hover:underline px-2 py-1 cursor-pointer"
        >
          Xoá đánh giá
        </button>
      )}
    </div>
  );
};

export default RatingSelector;
