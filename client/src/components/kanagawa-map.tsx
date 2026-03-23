import { useLocation } from "wouter";
import { AREAS } from "@shared/schema";

interface MapArea {
  id: string;
  name: string;
  cx: number;
  cy: number;
  shizuoka?: boolean;
}

// 実際の緯度経度から変換: x=(lon-138.78)/1.00*640, y=(35.73-lat)/0.68*475
// ViewBox "0 80 640 395"  visible y: 80→475
const mapAreas: MapArea[] = [
  { id: "sagamihara", name: "相模原", cx: 380, cy: 113 },   // 35.5683, 139.3729
  { id: "kawasaki",   name: "川崎",   cx: 591, cy: 139 },   // 35.5308, 139.7029
  { id: "yamato",     name: "大和",   cx: 448, cy: 180 },   // shifted right to avoid 厚木
  { id: "atsugi",     name: "厚木",   cx: 362, cy: 202 },   // shifted left to avoid 大和
  { id: "yokohama",   name: "横浜",   cx: 549, cy: 200 },   // 35.4437, 139.6380
  { id: "hadano",     name: "秦野",   cx: 288, cy: 249 },   // 35.3739, 139.2298
  { id: "hiratsuka",  name: "平塚",   cx: 364, cy: 278 },   // 35.3290, 139.3492
  { id: "kamakura",   name: "鎌倉",   cx: 480, cy: 284 },   // shifted left to avoid 横須賀
  { id: "yokosuka",   name: "横須賀", cx: 582, cy: 311 },   // shifted right to avoid 鎌倉
  { id: "odawara",    name: "小田原", cx: 253, cy: 331 },   // shifted right to avoid 箱根
  { id: "hakone",     name: "箱根",   cx: 150, cy: 350 },   // shifted left to avoid 小田原
  { id: "gotemba",    name: "御殿場", cx:  99, cy: 294, shizuoka: true }, // 35.3081, 138.9338
  { id: "atami",      name: "熱海",   cx: 187, cy: 441, shizuoka: true }, // 35.0980, 139.0717
];

// 相模湾沿岸を実際の位置に合わせた陸地パス
const LAND_PATH =
  "M 60,18 L 378,12 L 560,16 L 620,18 L 640,85 L 625,200 L 605,265 L 570,310 " +
  "L 550,415 L 530,458 L 510,445 L 500,395 L 488,335 L 472,305 " +
  "L 450,295 L 412,292 L 372,294 L 312,305 L 258,330 " +
  "L 230,405 L 198,428 L 182,455 L 148,432 L 82,362 L 48,278 L 52,228 L 78,172 L 118,138 L 210,108 " +
  "L 380,90 Z";

// 静岡県境界（簡易）
const SHIZUOKA_PATH =
  "M 60,18 L 120,138 L 78,172 L 52,228 L 48,278 L 82,362 L 148,432 L 182,455 " +
  "L 198,428 L 230,405 L 245,318 L 210,108 L 118,138 Z";

export default function KanagawaMap() {
  const [, navigate] = useLocation();

  const handleClick = (areaId: string) => {
    navigate(`/app/list?area=${areaId}`);
  };

  return (
    <div className="w-full flex flex-col gap-2">
      <svg
        viewBox="0 80 640 395"
        className="w-full"
        style={{ aspectRatio: "640/395" }}
      >
        <defs>
          <filter id="label-shadow" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodOpacity="0.15" />
          </filter>
          <linearGradient id="seaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#bfdbfe" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#93c5fd" stopOpacity="0.7" />
          </linearGradient>
        </defs>

        {/* 海（背景） */}
        <rect width="640" height="475" fill="url(#seaGrad)" rx="4" />

        {/* 陸地（神奈川＋静岡東部） */}
        <path d={LAND_PATH} fill="#fef3e2" stroke="#e8c97a" strokeWidth="1" />

        {/* 静岡エリア */}
        <path d={SHIZUOKA_PATH} fill="#ecfdf5" fillOpacity="0.6" stroke="none" />
        <path
          d="M 118,138 L 78,172 L 52,228 L 48,278 L 82,362 L 148,432 L 182,455 L 198,428 L 230,405 L 245,318 L 210,108 Z"
          fill="none" stroke="#6ee7b7" strokeWidth="1.2" strokeDasharray="5,4" opacity="0.7"
        />

        {/* 地名注記 */}
        <text x="350" y="445" textAnchor="middle" fontSize="11" fill="#1d4ed8" fillOpacity="0.5" className="select-none">相　模　湾</text>
        <text x="68" y="215" textAnchor="middle" fontSize="10" fill="#059669" fillOpacity="0.7" className="select-none">静岡県</text>
        <text x="470" y="100" textAnchor="middle" fontSize="10" fill="#92400e" fillOpacity="0.5" className="select-none">神 奈 川 県</text>

        {/* エリアラベル（主要13エリア） */}
        {mapAreas.map((area) => {
          const len = area.name.length;
          const fs = 28;
          const w = len * fs + 12;
          const h = fs + 12;
          const fillColor = "white";
          const strokeColor = "#d1d5db";
          const textColor = "#78350f";

          return (
            <g key={area.id} className="cursor-pointer" onClick={() => handleClick(area.id)}>
              <g filter="url(#label-shadow)">
                <rect
                  x={area.cx - w / 2} y={area.cy - h / 2}
                  width={w} height={h} rx="5"
                  fill={fillColor} stroke={strokeColor} strokeWidth="0.8"
                />
              </g>
              <text
                x={area.cx} y={area.cy + 10}
                textAnchor="middle" fontSize={fs} fontWeight="700"
                fill={textColor} className="select-none" pointerEvents="none"
              >
                {area.name}
              </text>
            </g>
          );
        })}

        {/* コンパスローズ */}
        <g transform="translate(25, 92)" opacity="0.45">
          <text x="0" y="7" textAnchor="middle" fontSize="8" fill="#78350f" fontWeight="700">北</text>
          <line x1="0" y1="9" x2="0" y2="20" stroke="#78350f" strokeWidth="1" />
          <polygon points="0,9 -3,17 0,14 3,17" fill="#78350f" />
        </g>
      </svg>

      {/* エリアボタン（横スクロール・全30エリア） */}
      <div className="relative">
        <div
          className="grid grid-rows-3 grid-flow-col gap-1 overflow-x-auto px-1 pb-1"
          style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {AREAS.map((area) => (
            <button
              key={area.id}
              className="flex-shrink-0 rounded-lg text-center font-bold py-1 px-2.5 active:scale-95 transition-all duration-150 whitespace-nowrap border border-gray-200 bg-white text-amber-900 hover:bg-orange-50 hover:border-orange-300"
              style={{ fontSize: "12px" }}
              onClick={() => handleClick(area.id)}
              data-testid={`button-area-${area.id}`}
            >
              {area.name}
            </button>
          ))}
        </div>
        <div className="absolute right-0 top-0 bottom-1 w-6 bg-gradient-to-l from-white to-transparent pointer-events-none" />
      </div>
    </div>
  );
}
