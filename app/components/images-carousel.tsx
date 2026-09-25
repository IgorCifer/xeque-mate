"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Image from "next/image";
import { useState } from "react";

interface ImageCarouselProps {
  title: string;
  description: string;
}

const images = [
  { alt: "Imagem 1", url: "/image_carousel_1.png" },
  { alt: "Imagem 2", url: "/image_carousel_2.png" },
  { alt: "Imagem 3", url: "/image_carousel_3.jpg" },
];

export default function ImagesCarousel({
  title,
  description,
}: ImageCarouselProps) {
  const [current, setCurrent] = useState(0);

  return (
    <div className="w-full">
      <Carousel
        className="w-full"
        opts={{ loop: false }}
        setApi={(api) => {
          if (!api) return;

          setCurrent(api.selectedScrollSnap());

          api.on("select", () => {
            setCurrent(api.selectedScrollSnap());
          });
        }}
      >
        <CarouselContent>
          {images.map((image, index) => (
            <CarouselItem key={index}>
              <div
                className="
          relative 
          w-full 
          h-[195px] 
          rounded-xl 
          overflow-hidden 
          border 
          border-gray-200
        "
              >
                <Image
                  fill
                  src={image.url}
                  alt={image.alt}
                  className="object-cover"
                />
                <div
                  className="
            absolute 
            bottom-0 
            left-0 
            w-full 
            px-3 
            py-2 
            bg-black/60 
            backdrop-blur-sm 
            text-white
          "
                >
                  <h2 className="text-[13px] line-clamp-1">{title}</h2>
                  <p className="text-[10px] line-clamp-1">{description}</p>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      <div className="flex justify-center items-center gap-2 w-full mt-2">
        {images.map((_, index) => (
          <span
            key={index}
            className={`inline-block w-2.5 h-2.5 rounded-full ${
              index === current
                ? "bg-white"
                : "bg-transparent border-white border"
            }`}
          ></span>
        ))}
      </div>
    </div>
  );
}
