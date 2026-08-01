"use client";

import {
  BookBookmarkIcon,
  GithubLogoIcon,
  PathIcon,
  QuestionIcon,
} from "@phosphor-icons/react";
import { useTour } from "@reactour/tour";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function HelpPopup() {
  const { setIsOpen, setCurrentStep } = useTour();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  return (
    <Popover onOpenChange={setIsPopoverOpen} open={isPopoverOpen}>
      <PopoverTrigger>
        <Button id="tour-step-5" size="icon" variant="outline">
          <QuestionIcon className="size-5" />
          <span className="sr-only">Help</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-fit p-1">
        <div className="grid gap-1">
          <Button
            className="rounded-sm"
            onClick={() => {
              setIsPopoverOpen(false);
              setIsOpen(true);
              setCurrentStep(0);
            }}
            variant="ghost"
          >
            <PathIcon className="size-5" />
            Start tour again
          </Button>
          <Button
            className="justify-start rounded-sm"
            onClick={() => {
              setIsPopoverOpen(false);
              window.open(
                "https://github.com/MohamedFazil1406/MAZI/blob/main/README.md",
                "_blank",
              );
            }}
            variant="ghost"
          >
            <BookBookmarkIcon className="size-5" />
            Documentation
          </Button>
          <Button
            className="justify-start rounded-sm"
            onClick={() => {
              setIsPopoverOpen(false);
              window.open("https://github.com/MohamedFazil1406", "_blank");
            }}
            variant="ghost"
          >
            <GithubLogoIcon className="size-5" />
            GitHub
          </Button>
          <p className="mt-1 text-center text-muted-foreground text-xs">
            With 💕 from{" "}
            <Link
              className="underline"
              href="https://www.fazil-coding.me/"
              rel="noreferrer"
              target="_blank"
            >
              Fazil
            </Link>
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
