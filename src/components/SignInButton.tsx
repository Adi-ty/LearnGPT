"use client";
import React from "react";
import { Button } from "./ui/button";
import { signIn } from "next-auth/react";

type Props = {
  variant?: React.ComponentProps<typeof Button>["variant"];
  className?: string;
  children?: React.ReactNode;
};

const SignInButton = ({ variant = "ghost", className, children }: Props) => {
  return (
    <Button
      variant={variant}
      className={className}
      onClick={() => {
        signIn("google");
      }}
    >
      {children ?? "Sign In"}
    </Button>
  );
};

export default SignInButton;
