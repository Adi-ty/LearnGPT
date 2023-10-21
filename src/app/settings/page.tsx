import SubscriptionButton from "@/components/SubscriptionButton";
import { checkSubscription } from "@/lib/subscription";
import type { Metadata } from "next";
import React from "react";

type Props = {};

export const metadata: Metadata = {
  title: "KnowPath - Learn GPT | Settings",
};

const SettingsPage = async (props: Props) => {
  const isPro = await checkSubscription();

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
      <div className="py-8 mx-auto max-w-7xl">
        <h1 className="text-3xl font-bold">Settings</h1>
        {isPro ? (
          <p className="text-xl text-secondary-foreground/60"> Pro User </p>
        ) : (
          <p className="text-xl text-secondary-foreground/60">free user</p>
        )}
        <SubscriptionButton isPro={isPro} />
      </div>
    </div>
  );
};

export default SettingsPage;
