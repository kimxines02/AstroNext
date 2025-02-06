"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import 'leaflet/dist/leaflet.css'; // Add this import to ensure correct styling


const DynamicMap = dynamic(() => import("@/components/Map"), { ssr: false });

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <Image
          className="dark:invert"
          src="/astro-black.png"
          alt="Next.js logo"
          width={250}
          height={52}
          priority
        />
        <DynamicMap />
      </main>
    </div>
  );
}
