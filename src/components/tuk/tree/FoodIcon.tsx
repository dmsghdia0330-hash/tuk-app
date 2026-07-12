import { Beer, Bike, Coffee, Cookie, Croissant, Drumstick, Pizza, Sandwich, Soup, Utensils, type LucideIcon } from "lucide-react";

// 앱 전체와 같은 lucide 라인 아이콘으로 음식을 표현한다(투박한 채움 대신 미니멀).
const FOOD_ICON: Record<string, LucideIcon> = {
  치킨: Drumstick,
  라면: Soup,
  김치찌개: Soup,
  국: Soup,
  찌개: Soup,
  커피: Coffee,
  빵: Croissant,
  배달: Bike,
  밥: Utensils,
  떡볶이: Utensils,
  피자: Pizza,
  버거: Sandwich,
  술: Beer,
  디저트: Cookie,
};

export default function FoodIcon({
  type,
  size = 40,
  color = "#E8A24C",
}: {
  type: string;
  size?: number;
  color?: string;
}) {
  const Icon = FOOD_ICON[type] ?? Utensils;
  return <Icon size={size} color={color} strokeWidth={1.6} style={{ display: "block" }} />;
}
