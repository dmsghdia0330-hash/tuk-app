import LegalPageShell from "@/components/tuk/legal/LegalPageShell";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 6 }}>{title}</div>
      <div>{children}</div>
    </div>
  );
}

const ulStyle = { margin: "8px 0 0", paddingLeft: 20 } as const;

export default function PrivacyPage() {
  return (
    <LegalPageShell title="개인정보 처리방침">
      <Section title="1. 총칙">
        툭(이하 &quot;서비스&quot;)은 이용자의 개인정보를 소중히 다루며, 「개인정보 보호법」 등 관련 법령을 준수합니다. 가입 전(게스트) 상태에서 남긴 기록은 서버로 전송되지 않고 이용자의 기기(브라우저)에만 저장되며, 가입(로그인) 시점에 계정으로 이전되어 서버에 보관됩니다.
      </Section>

      <Section title="2. 수집하는 개인정보 항목">
        <div>가. 회원가입·인증 과정</div>
        <ul style={ulStyle}>
          <li>이메일 주소 (계정 식별 및 로그인)</li>
          <li>생년월일 (만 14세 미만 여부 확인)</li>
          <li>만 14세 미만인 경우, 법정대리인 동의 여부 및 동의 시각</li>
        </ul>
        <div style={{ marginTop: 8 }}>나. 서비스 이용 과정</div>
        <ul style={ulStyle}>
          <li>이용자가 직접 남긴 기록(텍스트, 사진) 및 그로부터 생성된 태그·카테고리</li>
          <li>이용자가 태그를 고친 이력(개인화 목적)</li>
        </ul>
        <div style={{ marginTop: 8 }}>다. 자동으로 생성·수집되는 정보</div>
        <ul style={ulStyle}>
          <li>서비스 이용 과정에서의 접속 IP 주소(부정 이용·과다 호출 방지 목적)</li>
          <li>브라우저 로컬 저장소(localStorage)에 저장되는 게스트 기록 및 환경설정(테마, 방문 시각 등)</li>
        </ul>
      </Section>

      <Section title="3. 개인정보의 수집·이용 목적">
        <ul style={{ ...ulStyle, paddingLeft: 20, marginTop: 0 }}>
          <li>회원 식별 및 계정 연동, 로그인 인증</li>
          <li>이용자가 남긴 기록의 AI 자동 분류 및 월간 회고 리포트 생성</li>
          <li>개인화(이용자가 고친 표현을 이후 분류에 우선 반영)</li>
          <li>서비스의 안정적 운영, 부정 이용 방지</li>
          <li>만 14세 미만 아동의 법정대리인 동의 확인</li>
        </ul>
      </Section>

      <Section title="4. 보유 및 이용 기간">
        수집한 개인정보는 원칙적으로 <b>회원 탈퇴 또는 이용자의 삭제 요청 시까지</b> 보유·이용합니다. 이용자가 설정에서 &quot;모든 기록 완전히 지우기&quot;를 실행하면 서버의 기록·사진 및 개인화 이력이 즉시 파기됩니다. 게스트 기록은 서버에 저장되지 않으며 이용자가 기기에서 직접 삭제할 수 있습니다. 다만 법령에서 일정 기간 보관을 요구하는 경우 해당 기간 동안 보관합니다.
      </Section>

      <Section title="5. 개인정보의 제3자 제공">
        서비스는 이용자가 남긴 기록 내용을 광고 타겟팅에 사용하지 않으며, 이를 제3자에게 판매·제공하지 않습니다. 다만 법령에 따른 적법한 요구가 있거나 이용자가 사전에 동의한 경우에 한하여 제공할 수 있습니다.
      </Section>

      <Section title="6. 개인정보 처리의 위탁">
        서비스는 원활한 운영을 위해 아래와 같이 개인정보 처리를 위탁하고 있으며, 위탁계약 시 개인정보가 안전하게 관리되도록 필요한 사항을 규정합니다.
        <ul style={ulStyle}>
          <li>Supabase, Inc. — 계정 인증, 기록 데이터베이스 및 사진 저장</li>
          <li>Anthropic, PBC — 기록 텍스트의 AI 자동 분류</li>
          <li>Twilio Inc.(SendGrid) — 인증 코드 이메일 발송</li>
          <li>Vercel Inc. — 서비스(웹) 호스팅</li>
        </ul>
      </Section>

      <Section title="7. 개인정보의 국외 이전">
        서비스는 위 6항의 수탁사를 통해 개인정보를 국외로 이전(처리·보관)합니다.
        <ul style={ulStyle}>
          <li>이전받는 자 / 국가: 위 6항 각 사 / 미국</li>
          <li>이전 항목: 이메일 주소, 이용자가 남긴 기록(텍스트·사진), 태그·카테고리, 접속 IP 등 본 방침에 기재된 정보 중 각 위탁 목적에 필요한 항목</li>
          <li>이전 일시 및 방법: 서비스 이용 시점에 정보통신망을 통한 전송</li>
          <li>보유·이용 기간: 위탁 목적 달성 또는 회원 탈퇴·삭제 시까지</li>
        </ul>
      </Section>

      <Section title="8. 이용자 및 법정대리인의 권리와 행사 방법">
        이용자(및 만 14세 미만 아동의 법정대리인)는 언제든지 자신의 개인정보에 대한 열람·정정·삭제·처리정지를 요구할 수 있습니다. 설정 화면에서 전체 기록을 파일로 내보내거나(열람·이동), 전체 삭제를 직접 실행할 수 있으며, 그 밖의 요청은 아래 문의처를 통해 접수할 수 있습니다.
      </Section>

      <Section title="9. 만 14세 미만 아동의 개인정보">
        서비스는 만 14세 미만 아동의 회원가입 시 법정대리인의 동의를 받습니다. 법정대리인은 아동의 개인정보에 대한 열람·정정·삭제·처리정지 및 동의 철회를 요청할 수 있습니다.
      </Section>

      <Section title="10. 개인정보의 파기 절차 및 방법">
        보유기간이 지나거나 처리 목적이 달성된 개인정보는 지체 없이 파기합니다. 전자적 파일은 복구·재생이 불가능한 방법으로 삭제하며, 실수를 방지하기 위해 전체 삭제 실행 전 확인 절차를 거칩니다.
      </Section>

      <Section title="11. 안전성 확보 조치">
        <ul style={{ ...ulStyle, marginTop: 0 }}>
          <li>이용자별 데이터 접근 통제(행 수준 보안, RLS) — 본인 기록에만 접근 가능</li>
          <li>사진은 비공개 저장소에 보관하며, 열람 시에만 짧은 수명의 서명 URL을 발급</li>
          <li>전송 구간 암호화(HTTPS) 및 저장 데이터 암호화</li>
          <li>접근 권한의 최소화 및 관리</li>
        </ul>
      </Section>

      <Section title="12. 자동 수집 장치의 설치·운영 및 거부">
        서비스는 게스트 기록 보관과 환경설정 유지를 위해 브라우저 로컬 저장소(localStorage)를 사용합니다. 이용자는 브라우저 설정에서 저장을 거부하거나 저장된 데이터를 삭제할 수 있으나, 이 경우 게스트 기록이 유지되지 않을 수 있습니다.
      </Section>

      <Section title="13. AI 자동 분류에 관한 안내">
        AI가 생성한 카테고리·태그·인사이트는 참고용이며 의료적·심리적 진단을 의미하지 않습니다. 이용자의 기록에서 자해 등 위험 신호가 감지되면 상담 연락처 안내가 표시될 수 있으나, 이는 전문적 조치를 대체하지 않습니다.
      </Section>

      <Section title="14. 개인정보 보호책임자 및 문의처">
        개인정보 처리에 관한 문의·불만·피해구제는 아래로 접수할 수 있습니다. (정식 출시 전 실제 책임자 성명·연락처 및 수신 가능한 문의 이메일을 기입해야 합니다.)
        <ul style={ulStyle}>
          <li>개인정보 보호책임자: [성명 기입 예정]</li>
          <li>문의 이메일: [예: privacy@tukapp.cloud — 수신 설정 후 기입]</li>
        </ul>
      </Section>

      <Section title="15. 고지의 의무">
        이 개인정보 처리방침의 내용이 추가·삭제·수정되는 경우, 변경 사항을 시행 전 서비스 내 공지를 통해 알립니다.
      </Section>

      <Section title="16. 시행일">
        이 방침은 [시행일 기입]부터 적용됩니다. (초안 작성 기준일: 2026년 7월 11일)
      </Section>
    </LegalPageShell>
  );
}
