// 나무 SVG를 9:16 세로 이미지(인스타 스토리 규격)로 캡처해서 다운로드한다.
export async function exportTreeImage(svgEl: SVGSVGElement, monthLabel: string, fileSuffix: string): Promise<void> {
  const W = 1080;
  const H = 1920;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas 2d context를 만들 수 없어요");

  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#171A18");
  bg.addColorStop(0.6, "#131514");
  bg.addColorStop(1, "#0F1110");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const svgString = new XMLSerializer().serializeToString(svgEl);
  const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("나무 이미지를 불러오지 못했어요"));
      img.src = svgUrl;
    });

    const treeSize = W * 0.82;
    const treeX = (W - treeSize) / 2;
    const treeY = H * 0.24;
    ctx.drawImage(img, treeX, treeY, treeSize, treeSize);
  } finally {
    URL.revokeObjectURL(svgUrl);
  }

  await document.fonts?.ready?.catch(() => {});

  ctx.textAlign = "center";
  ctx.fillStyle = "#F3F5F7";
  ctx.font = "700 68px 'Gowun Batang', 'Nanum Myeongjo', serif";
  ctx.fillText(`${monthLabel}의 나무`, W / 2, H * 0.14);

  ctx.fillStyle = "#8F8F8F";
  ctx.font = "400 30px 'Pretendard', sans-serif";
  ctx.fillText("안 써도 괜찮은 기록 앱, 툭", W / 2, H * 0.945);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("이미지 생성에 실패했어요");

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `tuk-tree-${fileSuffix}.png`;
  a.click();
  URL.revokeObjectURL(url);
}
