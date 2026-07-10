"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import HomeScreen from "@/components/tuk/home/HomeScreen";
import { useTuk } from "@/context/AppContext";

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useTuk();
  const [ready, setReady] = useState(false);

  // 첫 방문자는 온보딩(3장 슬라이드 + CTA)을 먼저 봐야 한다. 이미 온보딩을
  // 마쳤거나(로컬 플래그) 이미 기록/계정이 있는 사람은 곧장 홈으로 보낸다.
  // 서버는 localStorage를 모르므로 마운트 후에만 판단해야 hydration이 깨지지 않는다.
  useEffect(() => {
    // 매직링크 인증이 실패하면 /auth/callback이 ?authError=1을 붙여 여기로 돌려보낸다.
    // 이 경우는 이미 로그인을 시도한 사람이므로 온보딩으로 보내지 않고 이유를 알려준다.
    if (searchParams.get("authError")) {
      showToast("로그인 링크가 만료됐거나 잘못됐어요. 다시 시도해주세요.");
      router.replace("/");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 위 주석 참고: 마운트 후 1회성 setState.
      setReady(true);
      return;
    }

    const onboarded = window.localStorage.getItem("tuk:onboarded");
    const hasLocalEntries = !!window.localStorage.getItem("tuk:entries");
    if (!onboarded && !hasLocalEntries) {
      router.replace("/onboarding");
      return;
    }
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  if (!ready) return null;
  return <HomeScreen />;
}
