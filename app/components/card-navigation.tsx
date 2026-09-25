import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import React from "react";

interface CardNavigationProps {
  image_url: string;
  title: string;
  description: string;
  navigate_to: string;
}

export default function CardNavigation({
  image_url,
  title,
  description,
  navigate_to,
}: CardNavigationProps) {
  return (
    <Link className="cursor-pointer" href={navigate_to}>
      <Card className="w-full backdrop-blur-md bg-white/20 text-white max-h-[161px]">
        <CardContent className="flex justify-between px-4 py-2 items-center">
          <div className="relative top-2 w-[131px] h-[131px]">
            <Image
              fill
              className="object-contain"
              src={image_url}
              alt={title}
            />
          </div>
          <div className="flex flex-col max-w-[50%]">
            <h2 className="text-sm">{title}</h2>
            <p className="text-[10px]">{description}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
