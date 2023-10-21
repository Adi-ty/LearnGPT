import TypewriterTitle from "@/components/TypewriterTitle";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "KnowPath - Learn GPT | Home",
  description: "KnowPath - Learn GPT is an AI powered learning platform",
};

export default function Home() {
  return (
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
      <h1 className="font-semibbold text-5xl text-center">
        Make Learning easier{" "}
        <span className="font-bold bg-gradient-to-r from-blue-600 via-green-500 to-rose-400 text-transparent bg-clip-text">
          Learn GPT
        </span>{" "}
        {""}
        AI powered learning platform
      </h1>
      <div className="mt-4"></div>
      <h2 className="font-semibold text-3xl text-center text-slate-700 dark:text-teal-300">
        <TypewriterTitle />
      </h2>
      <div className="mt-8"></div>
      <div className="flex justify-center">
        <Link href="/gallery">
          <Button className="bg-yellow-600 dark:bg-teal-600">
            Explore Now
            <ArrowRight className="ml-2 w-5 h-5" strokeWidth={3} />
          </Button>
        </Link>
      </div>
    </div>
  );
}
