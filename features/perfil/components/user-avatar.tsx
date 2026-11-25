import Image from "next/image";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";

type UserAvatarProps = {
  image: string | null | undefined;
  name: string;
  className?: string;
};

export function UserAvatar({ image, name, className }: UserAvatarProps) {
  return (
    <div className={cn("relative size-10 shrink-0 overflow-hidden rounded-full bg-white", className)}>
      {image ? (
        <Image src={image} alt={`Foto de ${name}`} fill unoptimized className="object-cover" />
      ) : (
        <User aria-hidden className="size-full p-[15%]" color="gray" />
      )}
    </div>
  );
}
