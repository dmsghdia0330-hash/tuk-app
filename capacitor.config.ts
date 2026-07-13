import type { CapacitorConfig } from "@capacitor/cli";

// 원격 로드(remote-load) 방식: 네이티브 껍데기가 실서버를 띄우고 그 위에
// 네이티브 기능(알림·위젯·결제)을 얹는다. 서버 API(/api/classify)·Supabase
// 쿠키 로그인·/auth/callback 이 그대로 작동하므로 웹 코드 재작성이 없다.
// 화면에 보이는 앱 이름은 각 플랫폼의 표시 이름(툭)으로 따로 지정한다.
// (appName은 Xcode 프로젝트/스킴 이름이라 ASCII로 둔다.)
const config: CapacitorConfig = {
  appId: "cloud.tukapp.app",
  appName: "Tuk",
  webDir: "native/www",
  server: {
    url: "https://tuk-app.vercel.app",
    cleartext: false,
  },
};

export default config;
