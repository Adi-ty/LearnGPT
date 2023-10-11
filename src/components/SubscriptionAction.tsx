"use client";
import { useSession } from "next-auth/react";
import React from "react";
import { Progress } from "./ui/progress";
import { Button } from "./ui/button";
import { Zap } from "lucide-react";
import axios from "axios";

type Props = {};

const SubscriptionAction = (props: Props) => {
  const { data } = useSession();
  const [loading, setLoading] = React.useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/stripe");
      window.location.href = response.data.url;
    } catch (err) {
      console.error("error", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-1/2 p-4 mx-auto mt-4 rounded-md bg-secondary">
      {data?.user.credits} / 5 Free Course Generation
      <Progress
        className="mt-2"
        value={data?.user.credits ? (data.user.credits / 5) * 100 : 0}
      />
      <Button
        disabled={loading}
        onClick={handleSubscribe}
        className="mt-3 font-bold text-white transition bg-gradient-to-tr from-teal-400 to-rose-400 hover:from-rose-500 hover:to-teal-600"
      >
        Upgrade Plan
        <Zap className="fill-white ml-2" />
      </Button>
    </div>
  );
};

export default SubscriptionAction;
