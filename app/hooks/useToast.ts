"use client";

import { useState } from "react";
import { ToastType } from "@/app/components/ui/Toast";

export function useToast() {
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState("");
  const [type, setType] =
    useState<ToastType>("success");

  function toast(
    text: string,
    toastType: ToastType = "success"
  ) {
    setMessage(text);
    setType(toastType);
    setShow(true);

    setTimeout(() => {
      setShow(false);
    }, 3000);
  }

  return {
    toast,
    show,
    message,
    type,
  };
}