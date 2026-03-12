import { useState } from "react";
import { useLocation } from "wouter";

interface AreaData {
  id: string;
  name: string;
  path: string;
  cx: number;
  cy: number;
}

const areas: AreaData[] = [
  { id: "hadano", name: "秦野", path: "M 10,100 L 50,55 L 100,40 L 145,50 L 160,80 L 155,130 L 160,175 L 140,195 L 100,200 L 60,185 L 25,155 Z", cx: 85, cy: 120 },
  { id: "minamiashigara", name: "南足柄", path: "M 10,100 L 25,155 L 60,185 L 50,230 L 20,260 L 0,240 L -5,200 L 0,155 Z", cx: 28, cy: 190 },
  { id: "kaisei", name: "開成", path: "M 50,55 L 100,40 L 145,50 L 125,25 L 80,15 Z", cx: 100, cy: 36 },
  { id: "odawara", name: "小田原", path: "M 60,185 L 100,200 L 140,195 L 160,220 L 150,260 L 130,290 L 95,310 L 50,315 L 20,300 L 10,275 L 20,260 L 50,230 Z", cx: 88, cy: 258 },
  { id: "ninomiya", name: "二宮", path: "M 140,195 L 160,175 L 185,195 L 195,225 L 175,240 L 160,220 Z", cx: 168, cy: 208 },
  { id: "isehara", name: "伊勢原", path: "M 155,130 L 160,80 L 195,60 L 230,70 L 245,100 L 250,140 L 235,175 L 210,195 L 185,195 L 160,175 Z", cx: 200, cy: 128 },
  { id: "oiso", name: "大磯", path: "M 185,195 L 210,195 L 235,205 L 260,210 L 250,245 L 220,255 L 195,250 L 195,225 Z", cx: 225, cy: 225 },
  { id: "atsugi", name: "厚木", path: "M 195,60 L 230,25 L 275,15 L 300,30 L 305,65 L 295,100 L 280,120 L 250,140 L 245,100 L 230,70 Z", cx: 262, cy: 72 },
  { id: "hiratsuka", name: "平塚", path: "M 235,175 L 250,140 L 280,120 L 310,130 L 330,155 L 325,190 L 300,210 L 260,210 L 235,205 Z", cx: 282, cy: 170 },
  { id: "ebina", name: "海老名", path: "M 300,30 L 305,65 L 295,100 L 330,100 L 345,75 L 355,45 L 340,20 Z", cx: 325, cy: 58 },
  { id: "chigasaki", name: "茅ヶ崎", path: "M 310,130 L 330,100 L 295,100 L 280,120 Z", cx: 303, cy: 112 },
  { id: "zama", name: "座間", path: "M 340,20 L 355,45 L 345,75 L 380,65 L 395,40 L 390,15 L 365,5 Z", cx: 368, cy: 38 },
  { id: "yamato", name: "大和", path: "M 345,75 L 330,100 L 310,130 L 330,155 L 365,160 L 400,140 L 420,110 L 415,80 L 395,65 L 380,65 Z", cx: 370, cy: 118 },
  { id: "ayase", name: "綾瀬", path: "M 380,65 L 395,40 L 390,15 L 420,10 L 440,25 L 435,55 L 420,80 L 415,80 L 395,65 Z", cx: 415, cy: 45 },
];

export default function KanagawaMap() {
  const [, navigate] = useLocation();
  const [hoveredArea, setHoveredArea] = useState<string | null>(null);

  const handleClick = (areaId: string) => {
    navigate(`/app/list?area=${areaId}`);
  };

  return (
    <div className="w-full flex flex-col gap-2">
      <svg
        viewBox="-10 0 460 325"
        className="w-full"
        style={{ aspectRatio: "460/325" }}
      >
        <defs>
          <filter id="label-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodOpacity="0.1" />
          </filter>
          <filter id="label-hover" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#f97316" floodOpacity="0.2" />
          </filter>
        </defs>

        {areas.map((area) => {
          const isHovered = hoveredArea === area.id;
          return (
            <path
              key={area.id}
              d={area.path}
              fill={isHovered ? "#fff7ed" : "#fef3e2"}
              stroke={isHovered ? "#fb923c" : "#fde1b0"}
              strokeWidth={isHovered ? "2" : "1.2"}
              strokeLinejoin="round"
              pointerEvents="none"
              style={{ transition: "all 0.2s ease" }}
            />
          );
        })}

        {areas.map((area) => {
          const isHovered = hoveredArea === area.id;
          const len = area.name.length;
          const w = len * 22 + 18;
          const h = 28;
          const scale = isHovered ? 1.1 : 1;
          return (
            <g
              key={`lbl-${area.id}`}
              className="cursor-pointer"
              style={{
                transform: `scale(${scale})`,
                transformOrigin: `${area.cx}px ${area.cy}px`,
                transition: "transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
              onClick={() => handleClick(area.id)}
              onMouseEnter={() => setHoveredArea(area.id)}
              onMouseLeave={() => setHoveredArea(null)}
            >
              <g filter={isHovered ? "url(#label-hover)" : "url(#label-shadow)"}>
                <rect
                  x={area.cx - w / 2}
                  y={area.cy - h / 2}
                  width={w}
                  height={h}
                  rx="8"
                  fill={isHovered ? "#f97316" : "white"}
                  stroke={isHovered ? "#ea580c" : "#e5e7eb"}
                  strokeWidth={isHovered ? "0" : "0.8"}
                />
              </g>
              <text
                x={area.cx}
                y={area.cy + 8}
                textAnchor="middle"
                fontSize="22"
                fontWeight="800"
                fill={isHovered ? "white" : "#78350f"}
                className="select-none"
                pointerEvents="none"
                style={{ transition: "fill 0.15s ease" }}
              >
                {area.name}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="relative">
        <div
          className="grid grid-rows-2 grid-flow-col gap-1.5 overflow-x-auto px-1 pb-1"
          style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {areas.map((area) => {
            const isHovered = hoveredArea === area.id;
            return (
              <button
                key={area.id}
                className="flex-shrink-0 rounded-lg text-center font-bold py-1.5 px-3 active:scale-95 transition-all duration-150 whitespace-nowrap"
                style={{
                  background: isHovered ? "#f97316" : "white",
                  border: isHovered ? "1px solid #ea580c" : "1px solid #e5e7eb",
                  color: isHovered ? "white" : "#78350f",
                  fontSize: "13px",
                }}
                onClick={() => handleClick(area.id)}
                onMouseEnter={() => setHoveredArea(area.id)}
                onMouseLeave={() => setHoveredArea(null)}
                data-testid={`button-area-${area.id}`}
              >
                {area.name}
              </button>
            );
          })}
        </div>
        <div className="absolute right-0 top-0 bottom-1 w-6 bg-gradient-to-l from-white to-transparent pointer-events-none" />
      </div>
    </div>
  );
}
