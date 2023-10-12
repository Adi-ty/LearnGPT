"use client";
import React from "react";
import Typewriter from "typewriter-effect";

type Props = {};

const TypewriterTitle = (props: Props) => {
  return (
    <Typewriter
      options={{
        loop: true,
      }}
      onInit={(typewriter) => {
        typewriter
          .typeString("Unlock AI's education potential.")
          .pauseFor(1000)
          .deleteAll()
          .typeString("Curate courses like never before.")
          .start();
      }}
    />
  );
};

export default TypewriterTitle;
