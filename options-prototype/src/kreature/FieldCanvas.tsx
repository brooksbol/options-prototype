/**
 * Kreature Field Canvas — renders ~961 symbols as a perceptual field using HTML5 Canvas.
 *
 * DESIGN:
 *   - Dark background. Symbols are points of light.
 *   - Brightness = magnitude of displacement from session reference (change-from-self).
 *   - Symbols that haven't changed much are dim. Symbols that moved substantially are bright.
 *   - Trails show recent displacement history as fading lines behind each glyph.
 *   - Spatial position is deterministic and stable (same symbol = same spot always).
 *   - No red/green good/bad encoding. Brightness and trail geometry carry the story.
 *   - Velocity determines a subtle directional indicator (not an arrow — a slight elongation).
 *
 * PERFORMANCE:
 *   - Canvas 2D for ~1000 points with trails is well within capability.
 *   - No DOM nodes per symbol. Pure pixel rendering.
 *   - requestAnimationFrame for smooth animation between state updates.
 *
 * INTERACTION:
 *   - Hover reveals symbol name + numbers in a tooltip.
 *   - Click pins the tooltip.
 */

import { useRef, useEffect, useCallback, useState } from "react";
import type { FieldState, FieldSymbol } from "./field-data";

interface FieldCanvasProps {
  /** Current field state to render */
  fieldState: FieldState | null;
  /** Canvas width */
  width: number;
  /** Canvas height */
  height: number;
  /** Optional: symbol currently hovered */
  onHover?: (symbol: FieldSymbol | null) => void;
  /** Optional: symbol clicked */
  onClick?: (symbol: FieldSymbol | null) => void;
}

// --- Visual Constants ---

const BG_COLOR = "#000000";
const GLYPH_BASE_ALPHA = 0.15;      // Dimmest symbols (no movement)
const GLYPH_MAX_ALPHA = 1.0;        // Brightest symbols (large movement)
const GLYPH_BASE_RADIUS = 2;        // Minimum dot size
const GLYPH_MAX_RADIUS = 5;         // Maximum dot size for largest movers
const GLYPH_COLOR = "180, 200, 255"; // Cool blue-white (RGB for alpha compositing)
const TRAIL_ALPHA_START = 0.4;       // Trail segment closest to glyph
const TRAIL_ALPHA_END = 0.02;        // Trail segment farthest from glyph (oldest)
const TRAIL_COLOR = "140, 160, 220"; // Slightly dimmer blue for trails
const DISPLACEMENT_VISUAL_SCALE = 800; // Pixels per 1.0 (100%) displacement — controls trail spread
const INSUFFICIENT_ALPHA = 0.06;     // Very dim for symbols with < 2 observations

// Magnitude → brightness mapping (non-linear to make small movements visible)
// A 0.5% move should be visible; a 3%+ move should be bright.
function magnitudeToBrightness(magnitude: number): number {
  // Soft curve: quick rise for small values, diminishing returns for large
  const normalized = Math.min(magnitude / 0.03, 1.0); // 3% = full brightness
  return GLYPH_BASE_ALPHA + (GLYPH_MAX_ALPHA - GLYPH_BASE_ALPHA) * Math.pow(normalized, 0.5);
}

function magnitudeToRadius(magnitude: number): number {
  const normalized = Math.min(magnitude / 0.03, 1.0);
  return GLYPH_BASE_RADIUS + (GLYPH_MAX_RADIUS - GLYPH_BASE_RADIUS) * Math.pow(normalized, 0.4);
}

export function FieldCanvas({ fieldState, width, height, onHover, onClick }: FieldCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const [hoveredSymbol, setHoveredSymbol] = useState<FieldSymbol | null>(null);

  // Hit detection: find nearest symbol to mouse position
  const findNearestSymbol = useCallback(
    (clientX: number, clientY: number): FieldSymbol | null => {
      if (!fieldState || !canvasRef.current) return null;
      const rect = canvasRef.current.getBoundingClientRect();
      const mx = clientX - rect.left;
      const my = clientY - rect.top;

      let nearest: FieldSymbol | null = null;
      let nearestDist = 20; // Max hit radius in pixels

      for (const sym of fieldState.symbols) {
        const sx = sym.x * width;
        const sy = sym.y * height;
        const dist = Math.sqrt((mx - sx) ** 2 + (my - sy) ** 2);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearest = sym;
        }
      }
      return nearest;
    },
    [fieldState, width, height]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const sym = findNearestSymbol(e.clientX, e.clientY);
      setHoveredSymbol(sym);
      onHover?.(sym);
    },
    [findNearestSymbol, onHover]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const sym = findNearestSymbol(e.clientX, e.clientY);
      onClick?.(sym);
    },
    [findNearestSymbol, onClick]
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredSymbol(null);
    onHover?.(null);
  }, [onHover]);

  // --- Rendering ---

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function render() {
      if (!ctx) return;

      // Clear
      ctx.fillStyle = BG_COLOR;
      ctx.fillRect(0, 0, width, height);

      if (!fieldState || fieldState.symbols.length === 0) {
        // Empty state
        ctx.fillStyle = "rgba(180, 200, 255, 0.3)";
        ctx.font = "12px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Waiting for field data\u2026", width / 2, height / 2);
        return;
      }

      // Draw all symbols
      for (const sym of fieldState.symbols) {
        drawSymbol(ctx, sym, width, height, sym === hoveredSymbol);
      }

      // Draw hovered symbol label
      if (hoveredSymbol) {
        drawTooltip(ctx, hoveredSymbol, width, height);
      }
    }

    render();

    // No continuous animation loop needed in static mode — render on state change
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [fieldState, width, height, hoveredSymbol]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="kr-field-canvas"
      onMouseMove={handleMouseMove}
      onClick={handleClick}
      onMouseLeave={handleMouseLeave}
    />
  );
}

// --- Drawing Functions ---

function drawSymbol(
  ctx: CanvasRenderingContext2D,
  sym: FieldSymbol,
  w: number,
  h: number,
  isHovered: boolean
) {
  const cx = sym.x * w;
  const cy = sym.y * h;

  if (!sym.hasSufficientData) {
    // Barely visible dot for symbols with insufficient data
    ctx.beginPath();
    ctx.arc(cx, cy, 1.5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${GLYPH_COLOR}, ${INSUFFICIENT_ALPHA})`;
    ctx.fill();
    return;
  }

  // Draw trail (displacement history as connected line segments)
  if (sym.trail.length >= 2) {
    drawTrail(ctx, sym, cx, cy, w, h);
  }

  // Draw glyph
  const brightness = magnitudeToBrightness(sym.magnitude);
  const radius = magnitudeToRadius(sym.magnitude);
  const alpha = isHovered ? 1.0 : brightness;
  const r = isHovered ? radius + 2 : radius;

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(${GLYPH_COLOR}, ${alpha})`;
  ctx.fill();

  // Subtle glow for bright symbols
  if (brightness > 0.5) {
    ctx.beginPath();
    ctx.arc(cx, cy, r + 3, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${GLYPH_COLOR}, ${(brightness - 0.5) * 0.15})`;
    ctx.fill();
  }
}

function drawTrail(
  ctx: CanvasRenderingContext2D,
  sym: FieldSymbol,
  cx: number,
  cy: number,
  _w: number,
  _h: number
) {
  const trail = sym.trail;
  if (trail.length < 2) return;

  // Trail points: each displacement value maps to a vertical offset from the symbol's home position.
  // This creates a visual "trail" showing where the symbol has been (in displacement space).
  // Horizontal spread is slight (based on trail index) to avoid all points stacking vertically.
  ctx.beginPath();

  for (let i = 0; i < trail.length; i++) {
    const displacement = trail[i];

    // Trail offset: displacement drives vertical position, slight horizontal spread
    const tx = cx + (i - trail.length + 1) * 2; // Slight leftward trail
    const ty = cy - displacement * DISPLACEMENT_VISUAL_SCALE; // Up = positive displacement

    if (i === 0) {
      ctx.moveTo(tx, ty);
    } else {
      ctx.lineTo(tx, ty);
    }
  }

  // Gradient alpha along the trail
  const alpha = TRAIL_ALPHA_START;
  ctx.strokeStyle = `rgba(${TRAIL_COLOR}, ${alpha})`;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Draw fading dots along trail
  for (let i = 0; i < trail.length - 1; i++) {
    const progress = i / (trail.length - 1);
    const displacement = trail[i];
    const tx = cx + (i - trail.length + 1) * 2;
    const ty = cy - displacement * DISPLACEMENT_VISUAL_SCALE;
    const dotAlpha = TRAIL_ALPHA_END + (TRAIL_ALPHA_START - TRAIL_ALPHA_END) * progress;

    ctx.beginPath();
    ctx.arc(tx, ty, 1, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${TRAIL_COLOR}, ${dotAlpha})`;
    ctx.fill();
  }
}

function drawTooltip(
  ctx: CanvasRenderingContext2D,
  sym: FieldSymbol,
  w: number,
  h: number
) {
  const cx = sym.x * w;
  const cy = sym.y * h;

  // Position tooltip above the symbol
  const tooltipX = Math.min(cx + 12, w - 160);
  const tooltipY = Math.max(cy - 45, 10);

  const pctChange = (sym.displacement * 100).toFixed(2);
  const sign = sym.displacement >= 0 ? "+" : "";
  const line1 = sym.symbol;
  const line2 = `$${sym.latestPrice.toFixed(2)}  ${sign}${pctChange}%`;
  const line3 = `${sym.momentCount} obs`;

  // Background
  ctx.fillStyle = "rgba(20, 22, 30, 0.92)";
  ctx.strokeStyle = "rgba(180, 200, 255, 0.3)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(tooltipX, tooltipY, 140, 50, 4);
  } else {
    ctx.rect(tooltipX, tooltipY, 140, 50);
  }
  ctx.fill();
  ctx.stroke();

  // Text
  ctx.font = "bold 11px ui-monospace, monospace";
  ctx.fillStyle = "rgba(220, 230, 255, 0.95)";
  ctx.textAlign = "left";
  ctx.fillText(line1, tooltipX + 8, tooltipY + 15);

  ctx.font = "11px ui-monospace, monospace";
  ctx.fillStyle = "rgba(180, 200, 255, 0.8)";
  ctx.fillText(line2, tooltipX + 8, tooltipY + 30);

  ctx.font = "9px system-ui, sans-serif";
  ctx.fillStyle = "rgba(140, 160, 200, 0.6)";
  ctx.fillText(line3, tooltipX + 8, tooltipY + 43);
}
