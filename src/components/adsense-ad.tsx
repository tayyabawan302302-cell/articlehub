"use client";

import { useEffect } from "react";

export default function AdsenseAd({ code }: { code: string }) {
  useEffect(() => {
    try {
      const adsbygoogle = (window as any).adsbygoogle || [];
      adsbygoogle.push({});
    } catch (error) {
      console.error("AdSense error:", error);
    }
  }, []);

  const html = code.replace(/<script[\s\S]*?<\/script>/gi, "");

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
