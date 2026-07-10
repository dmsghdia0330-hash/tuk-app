import LegalPageShell from "@/components/tuk/legal/LegalPageShell";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 6 }}>{title}</div>
      <div>{children}</div>
    </div>
  );
}

export default function TermsPage() {
  return (
    <LegalPageShell title="이용약관">
      <Section title="1. 목적">
        이 약관은 툭(이하 &quot;서비스&quot;)이 제공하는 AI 기반 기록·회고 서비스의 이용 조건과 절차, 이용자와 서비스 제공자의 권리·의무를 정합니다.
      </Section>
      <Section title="2. 서비스 내용">
        서비스는 이용자가 남긴 짧은 기록을 AI가 자동으로 분류하고, 월 단위로 시각화된 회고 리포트를 제공합니다. 가입 없이도 기본 기능을 이용할 수 있으며, 가입 시 기록이 계정에 연결되어 보관됩니다.
      </Section>
      <Section title="3. 이용 계약의 성립">
        이용자는 이메일 인증을 통해 계정을 만들 수 있으며, 가입 전 기기에 저장된 기록은 가입 시 계정으로 이전됩니다. 만 14세 미만 이용자는 법정대리인의 동의가 필요합니다.
      </Section>
      <Section title="4. 이용자의 의무">
        이용자는 타인의 정보를 도용하거나, 서비스를 부정한 목적으로 이용하거나, 서비스 운영을 방해하는 행위를 해서는 안 됩니다.
      </Section>
      <Section title="5. 서비스의 변경 및 중단">
        서비스는 운영상·기술상 필요에 따라 내용의 전부 또는 일부를 변경하거나 중단할 수 있으며, 중대한 변경 시 사전에 공지합니다.
      </Section>
      <Section title="6. AI 분류 및 인사이트에 대한 면책">
        서비스가 제공하는 카테고리 분류, 태그, 월간 인사이트는 참고용 정보이며 의료적·심리적 진단이 아닙니다. 이용자의 건강 상태에 대한 판단의 근거로 사용해서는 안 되며, 필요한 경우 반드시 전문가와 상담해야 합니다.
      </Section>
      <Section title="7. 책임 제한">
        서비스는 천재지변, 이용자의 귀책사유 등 통제할 수 없는 사유로 발생한 손해에 대해 책임을 지지 않습니다.
      </Section>
      <Section title="8. 약관의 변경">
        약관이 변경되는 경우 적용일자 및 변경사유를 명시하여 서비스 내 공지합니다.
      </Section>
      <Section title="9. 분쟁 해결">
        서비스와 이용자 간 발생한 분쟁에 대해서는 대한민국 법을 준거법으로 하며, 관할 법원은 관련 법령에 따라 정합니다.
      </Section>
    </LegalPageShell>
  );
}
