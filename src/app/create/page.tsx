import CreateCourseForm from "@/components/CreateCourseForm";
import { getAuthSession } from "@/lib/auth";
import { InfoIcon } from "lucide-react";
import { redirect } from "next/navigation";
import React from "react";

type Props = {};

const CreatePage = async (props: Props) => {
  const session = await getAuthSession();
  if (!session?.user) {
    return redirect("/");
  }
  return (
    <div className="flex flex-col items-center max-w-xl px-8 mx-auto my-4 sm:px-0">
      <h1 className="self-center text-3xl font-bold text-center sm:text-6xl">
        Learn GPT
      </h1>
      <div className="flex p-4 mt-5 border-none bg-secondary rounded-lg">
        <InfoIcon className="w-12 h-12 mr-3 text-red-600" />
        <div>
          Enter in what you want to learn in course title. Then enter a list of
          units, which you are specifically looking to learn. And our AI will
          generate the course for you.
        </div>
      </div>
      <CreateCourseForm />
    </div>
  );
};

export default CreatePage;
