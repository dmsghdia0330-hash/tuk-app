import LegalPageShell from "@/components/tuk/legal/LegalPageShell";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 6 }}>{title}</div>
      <div>{children}</div>
    </div>
  );
}

export default function PrivacyPage() {
  return (
    <LegalPageShell title="개인정보 처리방침">
      <Section title="1. 수집하는 개인정보 항목">
        이메일 주소(가입 시), 이용자가 직접 남긴 기록(텍스트·사진·음성 및 그로부터 생성된 태그), 서비스 이용 기록을 수집합니다.
      </Section>
      <Section title="2. 수집 목적">
        회원 식별 및 계정 연동, 기록의 AI 자동 분류, 월간 리포트 생성, 개인화(사용자가 고친 태그를 다음 분류에 반영) 목적으로만 사용합니다.
      </Section>
      <Section title="3. 광고 및 제3자 제공">
        이용자가 남긴 기록 내용을 광고 타겟팅에 사용하지 않으며, 법령에 따른 요구가 없는 한 기록을 제3자에게 판매하거나 제공하지 않습니다.
      </Section>
      <Section title="4. 처리 위탁 현황">
        서비스 운영을 위해 다음 업체에 개인정보 처리를 위탁합니다.
        <ul style={{ margin: "8px 0 0", paddingLeft: 20 }}>
          <li>Supabase (Supabase, Inc.) — 계정 인증, 기록 데이터베이스 저장</li>
          <li>Anthropic (Anthropic PBC) — 기록 텍스트의 AI 자동 분류</li>
        </ul>
      </Section>
      <Section title="5. 보관 및 파기">
        민감한 기록은 가입 전까지 기기에 우선 저장되며, 서버에는 서비스 제공에 필요한 최소한의 정보만 보관합니다. 이용자가 전체 삭제를 요청하면 서버에서 즉시 파기되며, 실수를 방지하기 위해 삭제 전 확인 절차를 거칩니다.
      </Section>
      <Section title="6. 이용자의 권리">
        이용자는 언제든 자신의 전체 기록을 파일로 내보내거나, 전체 삭제를 요청할 수 있습니다. 설정 화면에서 직접 실행할 수 있습니다.
      </Section>
      <Section title="7. 만 14세 미만 아동의 개인정보">
        만 14세 미만 이용자가 가입하려면 법정대리인의 동의가 필요합니다.
      </Section>
      <Section title="8. AI 분류에 대한 안내">
        AI가 생성한 카테고리·태그·인사이트는 참고용이며 의료적·심리적 진단을 의미하지 않습니다.
      </Section>
      <Section title="9. 안전성 확보 조치">
        개인정보에 대한 접근 권한 제한, 저장 데이터 암호화 등 안전성 확보를 위한 기술적·관리적 조치를 취합니다.
      </Section>
      <Section title="10. 문의처">
        개인정보 관련 문의는 서비스 내 고객센터(추후 안내)를 통해 접수할 수 있습니다.
      </Section>
    </LegalPageShell>
  );
}
