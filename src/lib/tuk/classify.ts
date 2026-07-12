// /api/classify(실제 LLM 호출)가 실패했을 때만 쓰는 키워드 기반 폴백.
export function guessTags(text: string): string[] {
  const t = text.toLowerCase();
  const tags: string[] = [];
  if (/(혼자.*(먹|밥))|혼밥/.test(t)) tags.push("혼밥");
  else if (/(밥|먹|점심|저녁|치킨|라면|빵|떡볶이)/.test(t))
    tags.push(/(밤|야식|11시|12시|새벽)/.test(t) ? "야식" : "혼밥");
  if (/(커피|카페|라떼|아아)/.test(t) && tags.length < 2) tags.push("카페인");
  if (/(기분.*(좋|최고))|행복|신남/.test(t) && tags.length < 2) tags.push("기분좋음");
  if (/(우울|무기력|힘들|피곤|지침)/.test(t) && tags.length < 2) tags.push("무기력");
  if (/(스트레스|짜증|화남|열받)/.test(t) && tags.length < 2) tags.push("스트레스");
  if (/(해야|제출|예약|신청|가야)/.test(t) && tags.length < 2) tags.push("할일");
  if (/(약속|만나|만남)/.test(t) && tags.length < 2) tags.push("약속");
  if (/(샀|구매|질렀|결제|주문)/.test(t) && tags.length < 2)
    tags.push(/(홧김|충동|또)/.test(t) ? "충동구매" : "소비");
  if (/(생리|월경)/.test(t) && tags.length < 2) tags.push("생리");
  else if (/(병원|진료|아파|아픔|몸살|두통|감기|열나)/.test(t) && tags.length < 2) tags.push("병원");
  else if (/(운동|헬스|러닝|산책|요가)/.test(t) && tags.length < 2) tags.push("운동");
  if (/(친구|동생|언니|형|엄마|같이|싸웠|다퉜)/.test(t) && tags.length < 2)
    tags.push(/(싸웠|다퉜|갈등)/.test(t) ? "갈등" : "친구");
  return [...new Set(tags)].slice(0, 2);
}
