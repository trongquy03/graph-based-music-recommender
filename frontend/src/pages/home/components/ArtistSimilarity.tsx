"use client";
import { useEffect, useState } from "react";
import { useUserRecommenderStore } from "@/stores/useRecommenderStore";
import { useNavigate } from "react-router-dom";
import type { RecommendedArtist } from "@/stores/useRecommenderStore";

// Preset vị trí theo kiểu "đám mây bất đối xứng" giống giao diện Last.fm, đã cân đều hơn
const PRESET_POSITIONS = [
  { left: "264px", top: "84px" },
  { left: "642px", top: "63px" },
  { left: "628px", top: "175px" },
  { left: "303px", top: "190px" },
  { left: "192px", top: "6px" },
  { left: "200px", top: "164px" },
  { left: "749px", top: "171px" },
  { left: "760px", top: "55px" },
  { left: "120px", top: "69px" },
  { left: "844px", top: "205px" },
  { left: "873px", top: "106px" },
  { left: "314px", top: "4px" },
  { left: "848px", top: "23px" },
  { left: "102px", top: "184px" },
  { left: "42px", top: "127px" },
  { left: "39px", top: "5px" },
  { left: "620px", top: "-12px" },
  { left: "696px", top: "0px" },
  { left: "933px", top: "188px" },
  { left: "932px", top: "19px" },
];

export default function SimilarArtistsDisplay() {
  const {
    recommendedArtists,
    fetchRecommendedArtists,
    fetchSimilarArtists,
  } = useUserRecommenderStore();

  const [mainArtist, setMainArtist] = useState<RecommendedArtist | null>(null);
  const [suggested, setSuggested] = useState<RecommendedArtist[]>([]);
  const [clickTracker, setClickTracker] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      await fetchRecommendedArtists();
      const artists = useUserRecommenderStore.getState().recommendedArtists;
      if (artists.length > 0) {
        const [main, ...others] = artists;
        setMainArtist(main);
        setSuggested(others.slice(0, 20));
      }
    };
    init();
  }, []);


let clickTimeout: ReturnType<typeof setTimeout> | undefined;

const handleArtistClick = (artist: RecommendedArtist) => {
  // Nếu artist giống với lần trước (double click)
  if (clickTimeout && clickTracker === artist._id) {
    clearTimeout(clickTimeout);
    clickTimeout = undefined;
    navigate(`/artists/${artist._id}`);
    return;
  }

  // Click mới => lưu id
  setClickTracker(artist._id);

  // Đợi xem có phải double click không
  clickTimeout = setTimeout(async () => {
    // Nếu khác mainArtist thì fetch
    if (!mainArtist || artist._id !== mainArtist._id) {
      const similar = await fetchSimilarArtists(artist._id);
      setMainArtist(artist);
      setSuggested(similar.slice(0, 20));
    }
    clickTimeout = undefined;
  }, 250);
};



  return (
    <div className="w-full min-h-[100px] text-white flex flex-col items-center pt-10">
      <h2 className="text-3xl font-bold mb-1 text-center">Similar Artists</h2>
      <p className="text-sm text-gray-400 mb-1 text-center">
        <span className="font-semibold text-white">{mainArtist?.name}</span> and their similar artists
      </p>

      <div className="relative w-[960px] h-[280px]">
        {mainArtist && (
          <div
            className="absolute z-30 flex flex-col items-center cursor-pointer text-center"
            style={{
              top: "45%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 220,
              height: 220,
            }}
            onClick={() => handleArtistClick(mainArtist)}
          >
            <div className="w-full h-full rounded-full overflow-hidden border-[3px] border-white shadow-xl">
              <img
                src={mainArtist.imageUrl}
                alt={mainArtist.name}
                className="w-full h-full object-cover"
              />
            </div>
            <p className="mt-2 text-lg font-semibold text-white text-center">
              {mainArtist.name}
            </p>
          </div>
        )}

        {suggested.map((artist, index) => {
          const pos = PRESET_POSITIONS[index];
          const maxSize = 90;
          const minSize = 50;
          const size = maxSize - (index * ((maxSize - minSize) / 19));

          return (
            <div
              key={artist._id}
              className="absolute flex flex-col items-center cursor-pointer group z-20"
              style={{
                ...pos,
                width: size,
                height: size,
                transform: "translate(-50%, -50%)",
              }}
              onClick={() => handleArtistClick(artist)}
            >
              <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-white shadow-md group-hover:scale-105 transition">
                <img
                  src={artist.imageUrl}
                  alt={artist.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute -top-1 -left-1 text-xs text-white bg-black rounded-full px-1">
                  {index + 1}
                </div>
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">
                  {artist.name} – {artist.similarity ? `${(artist.similarity * 100).toFixed(1)}%` : "N/A"}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
