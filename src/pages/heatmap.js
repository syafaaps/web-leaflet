import { useEffect } from "react";
import { useRouter } from "next/router";

export default function HeatmapRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/peta-pasar"); }, []);
  return null;
}
