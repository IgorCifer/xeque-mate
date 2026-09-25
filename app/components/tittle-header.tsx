import Image from "next/image";
import React from "react";

export default function TittleHeader() {
  return (
    <div className="text-white flex items-center justify-center gap-4 p-4 bg-blue-950/50 backdrop-blur-md">
      <div className="relative w-10 h-10">
        <Image
          fill
          className="object-contain"
          src={"/logo.png"}
          alt="Clube Xeque-Mate de Iguatu"
        />
      </div>
      <h2>Clube Xeque Mate de Iguatu</h2>
    </div>
  );
}
