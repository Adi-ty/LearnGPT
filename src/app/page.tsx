import TypewriterTitle from "@/components/TypewriterTitle";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
      <h1 className="font-semibbold text-5xl text-center">
        Make Learning easier{" "}
        <span className="font-bold text-yellow-600">Learn GPT</span> {""}
        AI powered learning platform
      </h1>
      <div className="mt-4"></div>
      <h2 className="font-semibold text-3xl text-center text-slate-700 dark:text-yellow-300">
        <TypewriterTitle />
      </h2>
      <div className="mt-8"></div>
      <div className="flex justify-center">
        <Link href="/gallery">
          <Button className="bg-yellow-600">
            Explore Now
            <ArrowRight className="ml-2 w-5 h-5" strokeWidth={3} />
          </Button>
        </Link>
      </div>
    </div>
  );
}
