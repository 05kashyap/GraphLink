import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ForceGraph2D, { type ForceGraphMethods, type LinkObject, type NodeObject } from "react-force-graph-2d";

import { communityColor } from "@/lib/palette";
import { useTheme } from "@/lib/theme";
import type { GraphData, GraphNode } from "@/lib/types";

type Node = NodeObject<GraphNode>;
type Link = LinkObject<GraphNode, { source: string; target: string }>;

interface NetworkCanvasProps {
  data: GraphData;
  /** The logged-in user, outlined in the graph. */
  me?: string | null;
  /** Usernames recommended to `me`; drawn with dashed edges when `showRecommendations`. */
  recommended?: string[];
  showRecommendations?: boolean;
  showLabels?: boolean;
  selected?: string | null;
  onSelect?: (id: string | null) => void;
  /** Static preview: no zoom, pan, drag or selection. */
  interactive?: boolean;
  /** Increment to zoom the view back to fit every node. */
  fitSignal?: number;
  className?: string;
}

const ACCENT = { light: "#4f46e5", dark: "#818cf8" };

function radius(node: GraphNode) {
  return 3 + Math.sqrt(node.degree) * 1.6;
}

// force-graph replaces link endpoints with node objects once the simulation starts.
function endpointId(end: unknown): string {
  return typeof end === "object" && end !== null ? String((end as Node).id) : String(end);
}

/** Weak pull towards the origin so isolated nodes don't drift off-screen. */
function gravity(strength: number) {
  let nodes: Node[] = [];
  const force = (alpha: number) => {
    for (const node of nodes) {
      node.vx = (node.vx ?? 0) - (node.x ?? 0) * strength * alpha;
      node.vy = (node.vy ?? 0) - (node.y ?? 0) * strength * alpha;
    }
  };
  force.initialize = (initial: Node[]) => {
    nodes = initial;
  };
  return force;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

export function NetworkCanvas({
  data,
  me,
  recommended = [],
  showRecommendations = false,
  showLabels = false,
  selected,
  onSelect,
  interactive = true,
  fitSignal = 0,
  className,
}: NetworkCanvasProps) {
  const { isDark } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<ForceGraphMethods<Node, Link>>();
  const previous = useRef(new Map<string, Node>());
  const fitted = useRef(false);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [hovered, setHovered] = useState<string | null>(null);

  // Track the container size so the canvas always fills it.
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Copy the API data (force-graph mutates it) and keep positions of nodes we
  // have already laid out, so a refetch after a follow doesn't reshuffle.
  const graphData = useMemo(() => {
    const nodes: Node[] = data.nodes.map((node) => {
      const old = previous.current.get(node.id);
      return old ? { ...node, x: old.x, y: old.y, vx: 0, vy: 0 } : { ...node };
    });
    previous.current = new Map(nodes.map((node) => [node.id, node]));
    return { nodes, links: data.links.map((link) => ({ ...link })) as Link[] };
  }, [data]);

  const neighbours = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const { source, target } of data.links) {
      if (!map.has(source)) map.set(source, new Set());
      if (!map.has(target)) map.set(target, new Set());
      map.get(source)!.add(target);
      map.get(target)!.add(source);
    }
    return map;
  }, [data]);

  const recommendedSet = useMemo(() => new Set(recommended), [recommended]);
  const focus = hovered ?? selected ?? null;
  const focusSet = useMemo(() => {
    if (!focus) return null;
    return new Set([focus, ...(neighbours.get(focus) ?? [])]);
  }, [focus, neighbours]);

  const ready = size.width > 0;
  useEffect(() => {
    const graph = graphRef.current;
    if (!ready || !graph) return;
    graph.d3Force("charge")?.strength(-140);
    graph.d3Force("link")?.distance(42);
    graph.d3Force("gravity", gravity(0.06));
    graph.d3ReheatSimulation();
  }, [ready]);

  useEffect(() => {
    if (fitSignal) graphRef.current?.zoomToFit(500, 48);
  }, [fitSignal]);

  const accent = isDark ? ACCENT.dark : ACCENT.light;
  const surface = isDark ? "#18181b" : "#ffffff";
  const ink = isDark ? "#e4e4e7" : "#27272a";
  const labelInk = isDark ? "#a1a1aa" : "#52525b";

  const paintNode = useCallback(
    (node: Node, ctx: CanvasRenderingContext2D, scale: number) => {
      const id = String(node.id);
      const r = radius(node);
      const x = node.x ?? 0;
      const y = node.y ?? 0;
      const dimmed = focusSet !== null && !focusSet.has(id);

      ctx.globalAlpha = dimmed ? 0.15 : 1;

      ctx.beginPath();
      ctx.arc(x, y, r, 0, 2 * Math.PI);
      ctx.fillStyle = communityColor(node.community, isDark);
      ctx.fill();
      ctx.lineWidth = 1.5 / scale;
      ctx.strokeStyle = surface;
      ctx.stroke();

      if (showRecommendations && recommendedSet.has(id)) {
        ctx.beginPath();
        ctx.arc(x, y, r + 3 / scale, 0, 2 * Math.PI);
        ctx.setLineDash([3 / scale, 2 / scale]);
        ctx.lineWidth = 1.5 / scale;
        ctx.strokeStyle = accent;
        ctx.stroke();
        ctx.setLineDash([]);
      }
      if (id === me || id === selected) {
        ctx.beginPath();
        ctx.arc(x, y, r + 3 / scale, 0, 2 * Math.PI);
        ctx.lineWidth = 2 / scale;
        ctx.strokeStyle = id === me ? ink : accent;
        ctx.stroke();
      }

      const labelled = showLabels || scale > 1.8 || id === me || id === focus || (showRecommendations && recommendedSet.has(id));
      if (labelled) {
        const fontSize = Math.max(11 / scale, 2);
        ctx.font = `${id === me ? 600 : 500} ${fontSize}px "Inter Variable", system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.lineWidth = 3 / scale;
        ctx.strokeStyle = surface;
        ctx.strokeText(id, x, y + r + 4 / scale);
        ctx.fillStyle = id === me || id === focus ? ink : labelInk;
        ctx.fillText(id, x, y + r + 4 / scale);
      }
      ctx.globalAlpha = 1;
    },
    [focusSet, focus, isDark, surface, accent, ink, labelInk, me, selected, showLabels, showRecommendations, recommendedSet],
  );

  const paintPointerArea = useCallback((node: Node, color: string, ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(node.x ?? 0, node.y ?? 0, radius(node) + 3, 0, 2 * Math.PI);
    ctx.fill();
  }, []);

  // Dashed "you → suggestion" edges, drawn underneath the nodes.
  const paintRecommendations = useCallback(
    (ctx: CanvasRenderingContext2D, scale: number) => {
      if (!showRecommendations || !me) return;
      const nodes = previous.current;
      const source = nodes.get(me);
      if (!source || source.x === undefined) return;
      ctx.save();
      ctx.setLineDash([4 / scale, 4 / scale]);
      ctx.lineWidth = 1.25 / scale;
      ctx.strokeStyle = accent;
      ctx.globalAlpha = 0.8;
      for (const id of recommendedSet) {
        const target = nodes.get(id);
        if (!target || target.x === undefined) continue;
        ctx.beginPath();
        ctx.moveTo(source.x, source.y ?? 0);
        ctx.lineTo(target.x, target.y ?? 0);
        ctx.stroke();
      }
      ctx.restore();
    },
    [showRecommendations, me, recommendedSet, accent],
  );

  const touchesFocus = (link: Link) =>
    focus !== null && (endpointId(link.source) === focus || endpointId(link.target) === focus);
  const baseLink = isDark ? "rgba(161,161,170,0.28)" : "rgba(113,113,122,0.28)";
  const fadedLink = isDark ? "rgba(161,161,170,0.08)" : "rgba(113,113,122,0.08)";

  return (
    <div ref={containerRef} className={className}>
      {size.width > 0 && (
        <ForceGraph2D<GraphNode, { source: string; target: string }>
          ref={graphRef}
          graphData={graphData}
          width={size.width}
          height={size.height}
          nodeRelSize={1}
          nodeVal={(node) => radius(node) ** 2}
          nodeCanvasObject={paintNode}
          nodePointerAreaPaint={paintPointerArea}
          nodeLabel={(node) => {
            const n = node as GraphNode;
            return `<div style="font-weight:600;margin-bottom:2px">${escapeHtml(n.id)}</div>
              <div>${n.in_degree} followers · ${n.out_degree} following</div>
              <div>Eigenvector centrality ${n.eigenvector.toFixed(2)}</div>
              ${n.is_articulation ? "<div>Bridge user (articulation point)</div>" : ""}`;
          }}
          linkColor={(link) => (touchesFocus(link) ? accent : focus ? fadedLink : baseLink)}
          linkWidth={(link) => (touchesFocus(link) ? 1.5 : 0.8)}
          linkDirectionalArrowLength={3.5}
          linkDirectionalArrowRelPos={1}
          onRenderFramePre={paintRecommendations}
          onNodeHover={(node) => {
            setHovered(node ? String(node.id) : null);
            if (containerRef.current) containerRef.current.style.cursor = node && interactive ? "pointer" : "";
          }}
          onNodeClick={(node) => interactive && onSelect?.(String(node.id))}
          onBackgroundClick={() => interactive && onSelect?.(null)}
          onEngineStop={() => {
            if (!fitted.current) {
              fitted.current = true;
              graphRef.current?.zoomToFit(400, interactive ? 48 : 16);
            }
          }}
          cooldownTicks={120}
          enableZoomInteraction={interactive}
          enablePanInteraction={interactive}
          enableNodeDrag={interactive}
          minZoom={0.5}
          maxZoom={6}
        />
      )}
    </div>
  );
}
