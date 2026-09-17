"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";

export interface RatingPoint {
  id: number;
  rating: number;
  ratingBefore?: number;
  delta?: number;
  date: string;
  result: "win" | "loss" | "draw" | "start";
  opponent: string;
}

interface RatingHistoryChartProps {
  data: RatingPoint[];
  currentRating: number;
  peakRating: number;
}

export function RatingHistoryChart({
  data,
  currentRating,
  peakRating,
}: RatingHistoryChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-amber-100/70">
        <p className="text-sm">No rating history available yet.</p>
      </div>
    );
  }

  // Width and height of SVG viewport
  const svgWidth = 720;
  const svgHeight = 240;
  const padLeft = 55;
  const padRight = 35;
  const padTop = 30;
  const padBottom = 35;

  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom;

  // Determine min & max ratings with buffer
  const ratings = data.map((d) => d.rating);
  const minRaw = Math.min(...ratings, 1150);
  const maxRaw = Math.max(...ratings, 1250);

  // Round min down to nearest 50, max up to nearest 50
  const yMin = Math.floor(minRaw / 50) * 50;
  const yMax = Math.ceil(maxRaw / 50) * 50;
  const yRange = Math.max(yMax - yMin, 100);

  // Compute points
  const points = data.map((pt, i) => {
    const x =
      data.length === 1
        ? padLeft + chartW / 2
        : padLeft + (i / (data.length - 1)) * chartW;
    const y = padTop + chartH - ((pt.rating - yMin) / yRange) * chartH;
    return { ...pt, x, y, index: i };
  });

  // Generate SVG path for line
  const linePath =
    points.length === 1
      ? `M ${padLeft} ${points[0].y} L ${padLeft + chartW} ${points[0].y}`
      : points.reduce((acc, pt, i) => {
          if (i === 0) return `M ${pt.x} ${pt.y}`;
          // Smooth curve using bezier control points
          const prev = points[i - 1];
          const cpx1 = prev.x + (pt.x - prev.x) / 2;
          const cpy1 = prev.y;
          const cpx2 = prev.x + (pt.x - prev.x) / 2;
          const cpy2 = pt.y;
          return `${acc} C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${pt.x} ${pt.y}`;
        }, "");

  // Generate SVG path for area fill under the line
  const lastPt = points[points.length - 1];
  const firstPt = points[0];
  const baselineY = padTop + chartH;
  const areaPath =
    points.length === 1
      ? `M ${padLeft} ${points[0].y} L ${padLeft + chartW} ${points[0].y} L ${padLeft + chartW} ${baselineY} L ${padLeft} ${baselineY} Z`
      : `${linePath} L ${lastPt.x} ${baselineY} L ${firstPt.x} ${baselineY} Z`;

  // Grid line values
  const gridStep = yRange <= 200 ? 50 : 100;
  const gridLines: number[] = [];
  for (let r = yMin; r <= yMax; r += gridStep) {
    gridLines.push(r);
  }

  const activePoint = hoveredIndex !== null ? points[hoveredIndex] : points[points.length - 1];

  const formatPointDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  return (
    <div className="w-full">
      {/* Chart Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 px-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
          <span className="text-xs font-black uppercase tracking-wider text-amber-200/90">
            Performance Progression
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
          <span className="px-2.5 py-1 rounded-xl bg-black/25 border border-amber-900/40">
            Peak: <strong className="text-amber-300 font-black">{peakRating}</strong>
          </span>
          <span className="px-2.5 py-1 rounded-xl bg-black/25 border border-amber-900/40">
            Current: <strong className="text-emerald-400 font-black">{currentRating}</strong>
          </span>
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div
        className="relative w-full rounded-2xl overflow-hidden p-2 sm:p-4"
        style={{
          background: "linear-gradient(145deg, rgba(35, 23, 10, 0.7) 0%, rgba(22, 14, 6, 0.85) 100%)",
          boxShadow: "inset 3px 3px 8px rgba(0,0,0,0.5), inset -3px -3px 8px rgba(255,200,120,0.05)",
          border: "1px solid rgba(180, 130, 70, 0.15)",
        }}
      >
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto overflow-visible select-none"
        >
          <defs>
            {/* Gradient fill under the rating curve */}
            <linearGradient id="clayRatingGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f5e4b0" stopOpacity="0.32" />
              <stop offset="60%" stopColor="#e8c96a" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#c97d10" stopOpacity="0.0" />
            </linearGradient>

            {/* Glowing line shadow */}
            <filter id="clayGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#f5e4b0" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Grid lines and rating y-labels */}
          {gridLines.map((val) => {
            const y = padTop + chartH - ((val - yMin) / yRange) * chartH;
            const isBaseline = val === 1200;
            return (
              <g key={val}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={padLeft + chartW}
                  y2={y}
                  stroke={isBaseline ? "rgba(251, 191, 36, 0.35)" : "rgba(255, 255, 255, 0.07)"}
                  strokeDasharray={isBaseline ? "4 3" : "2 3"}
                  strokeWidth={isBaseline ? "1.5" : "1"}
                />
                <text
                  x={padLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  fill={isBaseline ? "#fde68a" : "rgba(220, 200, 175, 0.5)"}
                  fontSize="11"
                  fontWeight={isBaseline ? "800" : "600"}
                  fontFamily="inherit"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          <path d={areaPath} fill="url(#clayRatingGradient)" />

          {/* Line path */}
          <path
            d={linePath}
            fill="none"
            stroke="#f5e4b0"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#clayGlow)"
          />

          {/* Data points */}
          {points.map((pt, idx) => {
            const isHovered = hoveredIndex === idx;
            const isWin = pt.result === "win";
            const isLoss = pt.result === "loss";
            const isStart = pt.result === "start";

            const pointColor = isStart
              ? "#fbbf24"
              : isWin
              ? "#34d399"
              : isLoss
              ? "#f87171"
              : "#fbbf24";

            return (
              <g
                key={pt.id}
                className="cursor-pointer transition-transform"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Hit target */}
                <circle cx={pt.x} cy={pt.y} r="14" fill="transparent" />

                {/* Point ring */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? "7" : points.length > 20 ? "3.5" : "5"}
                  fill={pointColor}
                  stroke="#2b1a0a"
                  strokeWidth={isHovered ? "2.5" : "2"}
                  className="transition-all duration-150"
                  style={{
                    filter: isHovered
                      ? `drop-shadow(0 0 8px ${pointColor})`
                      : "drop-shadow(0 1px 3px rgba(0,0,0,0.5))",
                  }}
                />
              </g>
            );
          })}

          {/* Active tooltip indicator line */}
          {activePoint && (
            <line
              x1={activePoint.x}
              y1={padTop}
              x2={activePoint.x}
              y2={padTop + chartH}
              stroke="rgba(255, 220, 160, 0.25)"
              strokeDasharray="2 2"
              strokeWidth="1"
              pointerEvents="none"
            />
          )}
        </svg>

        {/* Floating Tooltip Card */}
        {activePoint && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className="mt-3 flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-black/40 border border-amber-900/30 text-xs text-slate-200"
          >
            <div className="flex items-center gap-2">
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                  activePoint.result === "win"
                    ? "bg-emerald-500 text-emerald-950"
                    : activePoint.result === "loss"
                    ? "bg-rose-500 text-white"
                    : activePoint.result === "draw"
                    ? "bg-amber-400 text-black"
                    : "bg-slate-600 text-amber-200"
                }`}
              >
                {activePoint.result === "win"
                  ? "W"
                  : activePoint.result === "loss"
                  ? "L"
                  : activePoint.result === "draw"
                  ? "D"
                  : "♟"}
              </span>
              <div>
                <span className="font-bold text-white">
                  {activePoint.id === 0 ? "Account Initial Rating" : activePoint.opponent}
                </span>
                <span className="text-[11px] text-slate-400 block">
                  {formatPointDate(activePoint.date)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-amber-200 font-extrabold text-sm">
                Rating: {activePoint.rating}
              </span>
              {typeof activePoint.delta === "number" && activePoint.delta !== 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full font-black text-[11px] ${
                    activePoint.delta > 0
                      ? "bg-emerald-900/80 text-emerald-300 border border-emerald-700/60"
                      : "bg-rose-900/80 text-rose-300 border border-rose-700/60"
                  }`}
                >
                  {activePoint.delta > 0 ? `+${activePoint.delta}` : activePoint.delta}
                </span>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {data.length <= 1 && (
        <p className="text-xs text-amber-200/60 text-center mt-2.5 font-medium">
          💡 Play rated local games to track match-by-match rating volatility on this chart!
        </p>
      )}
    </div>
  );
}
