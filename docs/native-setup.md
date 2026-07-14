# 툭 네이티브 빌드 가이드 (Capacitor)

이 앱은 **원격 로드(remote-load)** 방식이다. 네이티브 껍데기가 실서버
`https://tuk-app.vercel.app` 를 띄우고, 그 위에 네이티브 기능(알림·위젯·결제)을
얹는다. 그래서:

- 웹 코드 재작성이 없다. 지금 작동하는 로그인·AI 분류·저장이 그대로 돈다.
- **네이티브 빌드에는 `.env.local`(비밀키)이 필요 없다.** 키는 Vercel에 있다.
- 인터넷이 필요하다(어차피 온라인 앱).

앱 ID: `cloud.tukapp.app` · 표시 이름: **툭**

---

## 0. Mac에 한 번만 설치

| 도구 | 용도 | 받는 곳 |
|---|---|---|
| **Node.js** (LTS) | 빌드 도구 | https://nodejs.org |
| **Xcode** | iOS 빌드 | Mac App Store (용량 큼, ~7GB) |
| **Android Studio** | 안드로이드 빌드 | https://developer.android.com/studio |

Xcode 설치 후 한 번 열어서 라이선스 동의 + 커맨드라인 도구 설치까지 끝내둔다.
Android Studio는 첫 실행 시 SDK·에뮬레이터를 자동으로 받는다(마법사 따라가면 됨).

---

## 1. 코드 받기

```bash
git clone https://github.com/dmsghdia0330-hash/tuk-app.git
cd tuk-app
npm install
npx cap sync        # 웹 자산 + 네이티브 플러그인 동기화
```

---

## 2. iOS 실행 (시뮬레이터)

Capacitor 8은 iOS에서 **Swift Package Manager**를 쓴다. CocoaPods 설치 불필요.

```bash
npx cap open ios
```

Xcode가 열리면:
1. 패키지 의존성 자동 해결이 끝날 때까지 잠깐 기다린다.
2. 상단 기기 선택에서 시뮬레이터(예: iPhone 15) 고르기.
3. ▶︎ (Run) 버튼. 시뮬레이터에 **툭**이 뜨고 실서버 화면이 로드되면 성공.

> 실기기(내 아이폰)에 올리려면 Xcode에서 무료 Apple ID로 서명(Signing & Capabilities
> 탭 → Team 선택)하면 된다. 스토어 출시는 유료 Apple Developer 계정($99/년)이 필요.

---

## 3. 안드로이드 실행 (에뮬레이터)

```bash
npx cap open android
```

Android Studio가 열리면:
1. 하단 Gradle 동기화가 끝날 때까지 기다린다(처음엔 몇 분).
2. 상단 기기 선택 → 에뮬레이터가 없으면 **Device Manager**에서 하나 생성.
3. ▶︎ (Run) 버튼. 에뮬레이터에 **툭**이 뜨면 성공.

---

## 웹을 고친 뒤에는?

원격 로드라서 **웹 변경은 Vercel에 배포만 하면 앱에 자동 반영**된다(앱 재빌드 불필요).
네이티브 설정(플러그인 추가, 아이콘, 권한 등)을 바꿨을 때만 `npx cap sync` 후 재빌드한다.

## 다음에 추가할 네이티브 기능

- [ ] 할 일 리마인더 (로컬 알림, `@capacitor/local-notifications`)
- [ ] 위젯 (홈 화면)
- [ ] 광고(AdMob) + 광고 제거 인앱결제
