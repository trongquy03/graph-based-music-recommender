"use client";
import { useEffect, useState } from "react";
import { useUserRecommenderStore } from "@/stores/useRecommenderStore";
import { useNavigate } from "react-router-dom";
import type { RecommendedArtist } from "@/stores/useRecommenderStore";

const PRESET_POSITIONS = [
  { left: "264px", top: "84px" },
  { left: "652px", top: "63px" },
  { left: "658px", top: "175px" },
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
  { left: "39px", top: "20px" },
  { left: "620px", top: "-12px" },
  { left: "696px", top: "0px" },
  { left: "933px", top: "188px" },
  { left: "932px", top: "19px" },
];

export default function SimilarArtistsDisplay() {
  const {
    recommendedArtists,
    fetchRecommendedArtists,
  } = useUserRecommenderStore();

  const [mainArtist, setMainArtist] = useState<RecommendedArtist | null>(null);
  const [suggested, setSuggested] = useState<RecommendedArtist[]>([]);
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

  const handleArtistClick = (artist: RecommendedArtist) => {
    navigate(`/artists/${artist._id}`);
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
          className="absolute flex flex-col items-center cursor-pointer text-center"
          style={{
            top: "45%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 260,
            height: 260,
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
            key={`${artist._id}-${index}`}
            className="absolute flex flex-col items-center cursor-pointer group"
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
            </div>

            {/* Tên nghệ sĩ hiển thị khi hover */}
            <div className="absolute bottom-[-20px] left-1/2 transform -translate-x-1/2 text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none">
              {artist.name}
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

}
