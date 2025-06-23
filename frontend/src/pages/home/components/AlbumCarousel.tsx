"use client";
import { useEffect, useState } from "react";
import { useMusicStore } from "@/stores/useMusicStore";
import { useKeenSlider } from "keen-slider/react";
import "keen-slider/keen-slider.min.css";
import { useNavigate } from "react-router-dom";

function getRandomAlbums<T>(albums: T[], count = 10): T[] {
  const shuffled = [...albums].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

const AlbumBannerCarousel = () => {
  const { albums, fetchAlbums } = useMusicStore();
  const [randomAlbums, setRandomAlbums] = useState<typeof albums>([]);
  const navigate = useNavigate();

  const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>({
    loop: true,
    slides: {
      perView: 2.2, 
      spacing: 24,
    },
    breakpoints: {
      "(min-width: 768px)": {
        slides: {
          perView: 2.3,
          spacing: 28,
        },
      },
      "(min-width: 1280px)": {
        slides: {
          perView: 2.4,
          spacing: 32,
        },
      },
    },
  });

  useEffect(() => {
    if (albums.length === 0) {
      fetchAlbums();
    } else {
      setRandomAlbums(getRandomAlbums(albums));
    }
  }, [albums, fetchAlbums]);

  useEffect(() => {
    const interval = setInterval(() => {
      instanceRef.current?.next();
    }, 10000);
    return () => clearInterval(interval);
  }, [instanceRef]);

  if (!randomAlbums.length) return null;

  return (
    <div className="relative group w-full max-w-[1280px] mx-auto px-0 sm:px-4">
      <div
        ref={sliderRef}
        className="keen-slider px-[8vw] overflow-visible"
      >
        {randomAlbums.map((album) => (
          <div
            key={album._id}
            className="keen-slider__slide cursor-pointer transition-transform duration-300"
            onClick={() => navigate(`/albums/${album._id}`)}
          >
            <img
              src={album.imageUrl}
              alt={album.title}
              className="w-full h-[180px] sm:h-[200px] lg:h-[210px] object-cover rounded-xl shadow-md hover:scale-[1.02] transition-transform"
            />
          </div>
        ))}
      </div>

      {/* Nút chuyển trái/phải chỉ hiện khi hover */}
      <button
        onClick={() => instanceRef.current?.prev()}
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition"
      >
        ❮
      </button>
      <button
        onClick={() => instanceRef.current?.next()}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition"
      >
        ❯
      </button>
    </div>
  );
};

export default AlbumBannerCarousel;
