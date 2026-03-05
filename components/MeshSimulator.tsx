'use client';

import React, { useCallback, useState, useEffect, useMemo, useRef } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  MarkerType,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { CustomNode, NodeData } from './CustomNode';
import {
  Play, AlertOctagon, Activity, RotateCcw, ShieldCheck, Zap,
  ChevronLeft, ChevronRight, Network, Gauge, Signal,
  BarChart3, TrendingUp, Clock, WifiOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const nodeTypes = {
  custom: CustomNode,
};

// ──────────────────────────────────────────────────
// LARGE MESH NETWORK TOPOLOGY (30 nodes)
// Hierarchical layout:  HQ → Gateways → Towers → Routers → Relays → Endpoints
// ──────────────────────────────────────────────────

const initialNodes: Node<NodeData>[] = [
  // Layer 0: Command Center (HQ)
  { id: 'hq', type: 'custom', position: { x: 800, y: 20 }, data: { label: 'Command Center', type: 'hq', status: 'online', metrics: { latency: 1, packetLoss: 0 } } },

  // Layer 1: Gateways (2)
  { id: 'gw-1', type: 'custom', position: { x: 370, y: 200 }, data: { label: 'Gateway Alpha', type: 'gateway', status: 'online', metrics: { latency: 3, packetLoss: 0 } } },
  { id: 'gw-2', type: 'custom', position: { x: 1230, y: 200 }, data: { label: 'Gateway Beta', type: 'gateway', status: 'online', metrics: { latency: 4, packetLoss: 0 } } },

  // Layer 2: Cellular Towers (3)
  { id: 'tower-1', type: 'custom', position: { x: 100, y: 400 }, data: { label: 'Tower West', type: 'tower', status: 'online', metrics: { latency: 10, packetLoss: 0 } } },
  { id: 'tower-2', type: 'custom', position: { x: 800, y: 400 }, data: { label: 'Tower Central', type: 'tower', status: 'online', metrics: { latency: 8, packetLoss: 0 } } },
  { id: 'tower-3', type: 'custom', position: { x: 1500, y: 400 }, data: { label: 'Tower East', type: 'tower', status: 'online', metrics: { latency: 11, packetLoss: 0 } } },

  // Layer 3: Mesh Routers (6)
  { id: 'r-1', type: 'custom', position: { x: 0, y: 620 }, data: { label: 'Router R1', type: 'router', status: 'online', metrics: { latency: 14, packetLoss: 0 } } },
  { id: 'r-2', type: 'custom', position: { x: 300, y: 620 }, data: { label: 'Router R2', type: 'router', status: 'online', metrics: { latency: 12, packetLoss: 0 } } },
  { id: 'r-3', type: 'custom', position: { x: 600, y: 620 }, data: { label: 'Router R3', type: 'router', status: 'online', metrics: { latency: 15, packetLoss: 0 } } },
  { id: 'r-4', type: 'custom', position: { x: 950, y: 620 }, data: { label: 'Router R4', type: 'router', status: 'online', metrics: { latency: 13, packetLoss: 0 } } },
  { id: 'r-5', type: 'custom', position: { x: 1280, y: 620 }, data: { label: 'Router R5', type: 'router', status: 'online', metrics: { latency: 16, packetLoss: 0 } } },
  { id: 'r-6', type: 'custom', position: { x: 1580, y: 620 }, data: { label: 'Router R6', type: 'router', status: 'online', metrics: { latency: 12, packetLoss: 0 } } },

  // Layer 4: Relay Nodes (7) - Between routers and endpoints for deeper redundancy
  { id: 'relay-1', type: 'custom', position: { x: -50, y: 850 }, data: { label: 'Relay RL1', type: 'relay', status: 'online', metrics: { latency: 18, packetLoss: 0 } } },
  { id: 'relay-2', type: 'custom', position: { x: 230, y: 850 }, data: { label: 'Relay RL2', type: 'relay', status: 'online', metrics: { latency: 20, packetLoss: 0 } } },
  { id: 'relay-3', type: 'custom', position: { x: 510, y: 850 }, data: { label: 'Relay RL3', type: 'relay', status: 'online', metrics: { latency: 19, packetLoss: 0 } } },
  { id: 'relay-4', type: 'custom', position: { x: 790, y: 850 }, data: { label: 'Relay RL4', type: 'relay', status: 'online', metrics: { latency: 17, packetLoss: 0 } } },
  { id: 'relay-5', type: 'custom', position: { x: 1070, y: 850 }, data: { label: 'Relay RL5', type: 'relay', status: 'online', metrics: { latency: 21, packetLoss: 0 } } },
  { id: 'relay-6', type: 'custom', position: { x: 1350, y: 850 }, data: { label: 'Relay RL6', type: 'relay', status: 'online', metrics: { latency: 22, packetLoss: 0 } } },
  { id: 'relay-7', type: 'custom', position: { x: 1630, y: 850 }, data: { label: 'Relay RL7', type: 'relay', status: 'online', metrics: { latency: 20, packetLoss: 0 } } },

  // Layer 5: Endpoints / Field Units (12)
  { id: 'ep-1', type: 'custom', position: { x: -100, y: 1090 }, data: { label: 'Field Unit 01', type: 'endpoint', status: 'online', metrics: { latency: 28, packetLoss: 0 } } },
  { id: 'ep-2', type: 'custom', position: { x: 80, y: 1090 }, data: { label: 'Field Unit 02', type: 'endpoint', status: 'online', metrics: { latency: 25, packetLoss: 0 } } },
  { id: 'ep-3', type: 'custom', position: { x: 260, y: 1090 }, data: { label: 'Field Unit 03', type: 'endpoint', status: 'online', metrics: { latency: 30, packetLoss: 0 } } },
  { id: 'ep-4', type: 'custom', position: { x: 440, y: 1090 }, data: { label: 'Field Unit 04', type: 'endpoint', status: 'online', metrics: { latency: 26, packetLoss: 0 } } },
  { id: 'ep-5', type: 'custom', position: { x: 620, y: 1090 }, data: { label: 'Field Unit 05', type: 'endpoint', status: 'online', metrics: { latency: 22, packetLoss: 0 } } },
  { id: 'ep-6', type: 'custom', position: { x: 820, y: 1090 }, data: { label: 'Field Unit 06', type: 'endpoint', status: 'online', metrics: { latency: 27, packetLoss: 0 } } },
  { id: 'ep-7', type: 'custom', position: { x: 1020, y: 1090 }, data: { label: 'Field Unit 07', type: 'endpoint', status: 'online', metrics: { latency: 24, packetLoss: 0 } } },
  { id: 'ep-8', type: 'custom', position: { x: 1220, y: 1090 }, data: { label: 'Field Unit 08', type: 'endpoint', status: 'online', metrics: { latency: 29, packetLoss: 0 } } },
  { id: 'ep-9', type: 'custom', position: { x: 1420, y: 1090 }, data: { label: 'Field Unit 09', type: 'endpoint', status: 'online', metrics: { latency: 31, packetLoss: 0 } } },
  { id: 'ep-10', type: 'custom', position: { x: 1620, y: 1090 }, data: { label: 'Field Unit 10', type: 'endpoint', status: 'online', metrics: { latency: 26, packetLoss: 0 } } },
  { id: 'ep-11', type: 'custom', position: { x: 440, y: 1300 }, data: { label: 'Field Unit 11', type: 'endpoint', status: 'online', metrics: { latency: 35, packetLoss: 0 } } },
  { id: 'ep-12', type: 'custom', position: { x: 1120, y: 1300 }, data: { label: 'Field Unit 12', type: 'endpoint', status: 'online', metrics: { latency: 33, packetLoss: 0 } } },
];

// ──────────────────────────────────────────────────
// EDGE STYLES
// ──────────────────────────────────────────────────

const primaryEdge = {
  type: 'smoothstep' as const,
  animated: true,
  style: { stroke: '#10b981', strokeWidth: 2 },
  markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' },
};

const backupEdge = {
  type: 'smoothstep' as const,
  animated: false,
  style: { stroke: '#334155', strokeWidth: 1, strokeDasharray: '5,5' },
};

const crossLinkEdge = {
  type: 'smoothstep' as const,
  animated: false,
  style: { stroke: '#1e293b', strokeWidth: 1, strokeDasharray: '3,6' },
};

// ──────────────────────────────────────────────────
// EDGES — Every node is connected to at LEAST 2 other nodes
// ensuring no isolated clusters can form after a single-point
// failure. The topology follows mesh networking best practices.
// ──────────────────────────────────────────────────

const initialEdges: Edge[] = [
  // ── HQ to Gateways (2 primary links) ──
  { id: 'e-hq-gw1', source: 'hq', target: 'gw-1', ...primaryEdge },
  { id: 'e-hq-gw2', source: 'hq', target: 'gw-2', ...primaryEdge },

  // ── Cross-link between gateways (redundancy) ──
  { id: 'e-gw1-gw2', source: 'gw-1', target: 'gw-2', sourceHandle: 'right', targetHandle: 'left', ...backupEdge },

  // ── HQ direct to Tower Central (redundancy) ──
  { id: 'e-hq-tc', source: 'hq', target: 'tower-2', ...backupEdge },

  // ── Gateways to Towers ──
  { id: 'e-gw1-tw1', source: 'gw-1', target: 'tower-1', ...primaryEdge },
  { id: 'e-gw1-tw2', source: 'gw-1', target: 'tower-2', ...primaryEdge },
  { id: 'e-gw2-tw2', source: 'gw-2', target: 'tower-2', ...primaryEdge },
  { id: 'e-gw2-tw3', source: 'gw-2', target: 'tower-3', ...primaryEdge },

  // ── Tower cross-links (redundancy) ──
  { id: 'e-tw1-tw2', source: 'tower-1', target: 'tower-2', sourceHandle: 'right', targetHandle: 'left', ...backupEdge },
  { id: 'e-tw2-tw3', source: 'tower-2', target: 'tower-3', sourceHandle: 'right', targetHandle: 'left', ...backupEdge },

  // ── Towers to Routers ──
  { id: 'e-tw1-r1', source: 'tower-1', target: 'r-1', ...primaryEdge },
  { id: 'e-tw1-r2', source: 'tower-1', target: 'r-2', ...primaryEdge },
  { id: 'e-tw2-r3', source: 'tower-2', target: 'r-3', ...primaryEdge },
  { id: 'e-tw2-r4', source: 'tower-2', target: 'r-4', ...primaryEdge },
  { id: 'e-tw3-r5', source: 'tower-3', target: 'r-5', ...primaryEdge },
  { id: 'e-tw3-r6', source: 'tower-3', target: 'r-6', ...primaryEdge },

  // ── Router mesh cross-links (horizontal redundancy — prevents cluster isolation) ──
  { id: 'e-r1-r2', source: 'r-1', target: 'r-2', sourceHandle: 'right', targetHandle: 'left', ...backupEdge },
  { id: 'e-r2-r3', source: 'r-2', target: 'r-3', sourceHandle: 'right', targetHandle: 'left', ...backupEdge },
  { id: 'e-r3-r4', source: 'r-3', target: 'r-4', sourceHandle: 'right', targetHandle: 'left', ...backupEdge },
  { id: 'e-r4-r5', source: 'r-4', target: 'r-5', sourceHandle: 'right', targetHandle: 'left', ...backupEdge },
  { id: 'e-r5-r6', source: 'r-5', target: 'r-6', sourceHandle: 'right', targetHandle: 'left', ...backupEdge },
  // Skip-link for deeper redundancy (R2→R4, R3→R5)
  { id: 'e-r2-r4', source: 'r-2', target: 'r-4', ...crossLinkEdge },
  { id: 'e-r3-r5', source: 'r-3', target: 'r-5', ...crossLinkEdge },

  // ── Routers to Relays ──
  { id: 'e-r1-rl1', source: 'r-1', target: 'relay-1', ...primaryEdge },
  { id: 'e-r1-rl2', source: 'r-1', target: 'relay-2', ...primaryEdge },
  { id: 'e-r2-rl2', source: 'r-2', target: 'relay-2', ...primaryEdge },
  { id: 'e-r2-rl3', source: 'r-2', target: 'relay-3', ...primaryEdge },
  { id: 'e-r3-rl3', source: 'r-3', target: 'relay-3', ...primaryEdge },
  { id: 'e-r3-rl4', source: 'r-3', target: 'relay-4', ...primaryEdge },
  { id: 'e-r4-rl4', source: 'r-4', target: 'relay-4', ...primaryEdge },
  { id: 'e-r4-rl5', source: 'r-4', target: 'relay-5', ...primaryEdge },
  { id: 'e-r5-rl5', source: 'r-5', target: 'relay-5', ...primaryEdge },
  { id: 'e-r5-rl6', source: 'r-5', target: 'relay-6', ...primaryEdge },
  { id: 'e-r6-rl6', source: 'r-6', target: 'relay-6', ...primaryEdge },
  { id: 'e-r6-rl7', source: 'r-6', target: 'relay-7', ...primaryEdge },

  // ── Relay cross-links (horizontal mesh redundancy) ──
  { id: 'e-rl1-rl2', source: 'relay-1', target: 'relay-2', sourceHandle: 'right', targetHandle: 'left', ...backupEdge },
  { id: 'e-rl2-rl3', source: 'relay-2', target: 'relay-3', sourceHandle: 'right', targetHandle: 'left', ...backupEdge },
  { id: 'e-rl3-rl4', source: 'relay-3', target: 'relay-4', sourceHandle: 'right', targetHandle: 'left', ...backupEdge },
  { id: 'e-rl4-rl5', source: 'relay-4', target: 'relay-5', sourceHandle: 'right', targetHandle: 'left', ...backupEdge },
  { id: 'e-rl5-rl6', source: 'relay-5', target: 'relay-6', sourceHandle: 'right', targetHandle: 'left', ...backupEdge },
  { id: 'e-rl6-rl7', source: 'relay-6', target: 'relay-7', sourceHandle: 'right', targetHandle: 'left', ...backupEdge },

  // ── Relays to Endpoints ──
  { id: 'e-rl1-ep1', source: 'relay-1', target: 'ep-1', ...primaryEdge },
  { id: 'e-rl1-ep2', source: 'relay-1', target: 'ep-2', ...primaryEdge },
  { id: 'e-rl2-ep2', source: 'relay-2', target: 'ep-2', ...primaryEdge },
  { id: 'e-rl2-ep3', source: 'relay-2', target: 'ep-3', ...primaryEdge },

  // ── Backup links for western endpoints (prevent orphaning when relay-1 fails) ──
  // ep-1 needs AT LEAST one backup path that doesn't go through relay-1/r-1/r-2/gw-1/tower-1
  // Path: ep-1 → relay-2 → relay-3 → r-3 → tower-2 → gw-2 → hq
  { id: 'e-ep1-rl2', source: 'ep-1', target: 'relay-2', sourceHandle: 'right', targetHandle: 'left', ...backupEdge },
  // ep-1 → ep-2 peer link for additional redundancy
  { id: 'e-ep1-ep2', source: 'ep-1', target: 'ep-2', sourceHandle: 'right', targetHandle: 'left', ...backupEdge },
  // ep-2 → relay-3 cross-link for deeper redundancy
  { id: 'e-ep2-rl3', source: 'ep-2', target: 'relay-3', ...crossLinkEdge },
  { id: 'e-rl3-ep3', source: 'relay-3', target: 'ep-3', ...primaryEdge },
  { id: 'e-rl3-ep4', source: 'relay-3', target: 'ep-4', ...primaryEdge },
  { id: 'e-rl4-ep5', source: 'relay-4', target: 'ep-5', ...primaryEdge },
  { id: 'e-rl4-ep6', source: 'relay-4', target: 'ep-6', ...primaryEdge },
  { id: 'e-rl5-ep6', source: 'relay-5', target: 'ep-6', ...primaryEdge },
  { id: 'e-rl5-ep7', source: 'relay-5', target: 'ep-7', ...primaryEdge },
  { id: 'e-rl5-ep8', source: 'relay-5', target: 'ep-8', ...primaryEdge },
  { id: 'e-rl6-ep8', source: 'relay-6', target: 'ep-8', ...primaryEdge },
  { id: 'e-rl6-ep9', source: 'relay-6', target: 'ep-9', ...primaryEdge },
  { id: 'e-rl7-ep9', source: 'relay-7', target: 'ep-9', ...primaryEdge },
  { id: 'e-rl7-ep10', source: 'relay-7', target: 'ep-10', ...primaryEdge },

  // ── Deep endpoint links (ep-11 and ep-12 multi-connected) ──
  { id: 'e-ep4-ep11', source: 'ep-4', target: 'ep-11', ...primaryEdge },
  { id: 'e-ep5-ep11', source: 'ep-5', target: 'ep-11', ...primaryEdge },
  { id: 'e-ep3-ep11', source: 'ep-3', target: 'ep-11', ...backupEdge },
  { id: 'e-ep7-ep12', source: 'ep-7', target: 'ep-12', ...primaryEdge },
  { id: 'e-ep8-ep12', source: 'ep-8', target: 'ep-12', ...primaryEdge },
  { id: 'e-ep9-ep12', source: 'ep-9', target: 'ep-12', ...backupEdge },

  // ── Additional cross-layer redundancy ──
  // These connect endpoints back up to routers directly (skip relay),
  // creating alternative paths for AODV to discover
  { id: 'e-r2-ep3', source: 'r-2', target: 'ep-3', ...crossLinkEdge },
  { id: 'e-r4-ep6', source: 'r-4', target: 'ep-6', ...crossLinkEdge },
  { id: 'e-r5-ep8', source: 'r-5', target: 'ep-8', ...crossLinkEdge },
];

// ──────────────────────────────────────────────────
// ADJACENCY & GRAPH UTILITIES
// Used for proper AODV-like route discovery and
// connectivity checks to prevent cluster isolation.
// ──────────────────────────────────────────────────

function buildAdjacencyList(edges: Edge[]): Map<string, Set<string>> {
  const adj = new Map<string, Set<string>>();
  for (const edge of edges) {
    if (!adj.has(edge.source)) adj.set(edge.source, new Set());
    if (!adj.has(edge.target)) adj.set(edge.target, new Set());
    adj.get(edge.source)!.add(edge.target);
    adj.get(edge.target)!.add(edge.source);
  }
  return adj;
}

/**
 * BFS to check if `targetId` is reachable from `sourceId` via nodes that are NOT offline.
 */
function bfsReachable(
  adj: Map<string, Set<string>>,
  sourceId: string,
  targetId: string,
  offlineNodes: Set<string>
): string[] | null {
  if (offlineNodes.has(sourceId) || offlineNodes.has(targetId)) return null;
  const visited = new Set<string>();
  const parentMap = new Map<string, string | null>();
  const queue: string[] = [sourceId];
  visited.add(sourceId);
  parentMap.set(sourceId, null);

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === targetId) {
      // Reconstruct path
      const path: string[] = [];
      let node: string | null = targetId;
      while (node !== null) {
        path.unshift(node);
        node = parentMap.get(node) ?? null;
      }
      return path;
    }
    const neighbors = adj.get(current);
    if (neighbors) {
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor) && !offlineNodes.has(neighbor)) {
          visited.add(neighbor);
          parentMap.set(neighbor, current);
          queue.push(neighbor);
        }
      }
    }
  }
  return null;
}

/**
 * Finds all connected components among non-offline nodes.
 */
function findConnectedComponents(
  adj: Map<string, Set<string>>,
  allNodeIds: string[],
  offlineNodes: Set<string>
): string[][] {
  const visited = new Set<string>();
  const components: string[][] = [];

  for (const nodeId of allNodeIds) {
    if (offlineNodes.has(nodeId) || visited.has(nodeId)) continue;
    const component: string[] = [];
    const queue: string[] = [nodeId];
    visited.add(nodeId);
    while (queue.length > 0) {
      const current = queue.shift()!;
      component.push(current);
      const neighbors = adj.get(current);
      if (neighbors) {
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor) && !offlineNodes.has(neighbor)) {
            visited.add(neighbor);
            queue.push(neighbor);
          }
        }
      }
    }
    components.push(component);
  }
  return components;
}

/**
 * Compute average latency based on hop count from HQ using BFS.
 * Base latency per hop increases with each hop: hopLatency = basePerHop * (1 + 0.15 * hop)
 */
function computeLatencyFromHQ(
  adj: Map<string, Set<string>>,
  nodeId: string,
  offlineNodes: Set<string>,
  basePerHop: number = 5
): number {
  const path = bfsReachable(adj, 'hq', nodeId, offlineNodes);
  if (!path) return 999;
  const hops = path.length - 1;
  // Latency grows with path length, with a jitter factor
  let totalLatency = 0;
  for (let i = 1; i <= hops; i++) {
    totalLatency += basePerHop * (1 + 0.15 * i);
  }
  return Math.round(totalLatency * 10) / 10;
}

/**
 * Packet loss increases with hop count: loss = 1 - (1 - lossPerHop)^hops
 */
function computePacketLoss(hops: number, lossPerHop: number = 0.005): number {
  if (hops <= 0) return 0;
  const successRate = Math.pow(1 - lossPerHop, hops);
  return Math.round((1 - successRate) * 10000) / 100;
}

type SimState = 'NORMAL' | 'DISASTER' | 'HEALING' | 'RECOVERED';

// ──────────────────────────────────────────────────
// Nodes that go offline during disaster
// ──────────────────────────────────────────────────
const DISASTER_OFFLINE_NODES = ['tower-1', 'gw-1', 'r-1', 'r-2', 'relay-1'];

export default function MeshSimulator() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [simState, setSimState] = useState<SimState>('NORMAL');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [connectionLog, setConnectionLog] = useState<string[]>([]);
  const logRef = useRef<HTMLDivElement>(null);

  const totalNodes = initialNodes.length;

  // ── Live metrics computed from current node state ──
  const metrics = useMemo(() => {
    const onlineNodes = nodes.filter(n => (n.data as NodeData).status !== 'offline');
    const activeCount = onlineNodes.length;
    const totalLatency = onlineNodes.reduce((sum, n) => sum + ((n.data as NodeData).metrics?.latency || 0), 0);
    const avgLatency = activeCount > 0 ? Math.round((totalLatency / activeCount) * 10) / 10 : 0;
    const totalLoss = onlineNodes.reduce((sum, n) => sum + ((n.data as NodeData).metrics?.packetLoss || 0), 0);
    const avgLoss = activeCount > 0 ? Math.round((totalLoss / activeCount) * 100) / 100 : 100;
    const health = Math.round((activeCount / totalNodes) * 100 * (1 - avgLoss / 100));

    return { avgLatency, packetLoss: avgLoss, activeNodes: activeCount, networkHealth: health };
  }, [nodes, totalNodes]);

  // ── Adjacency list for graph algorithms ──
  const adjacency = useMemo(() => buildAdjacencyList(edges), [edges]);

  // ── Connection tracking ──
  const connectionStats = useMemo(() => {
    const primaryEdges = edges.filter(e => e.animated === true);
    const backupEdges = edges.filter(e => e.animated === false);
    const offlineNodeIds = new Set(
      nodes.filter(n => (n.data as NodeData).status === 'offline').map(n => n.id)
    );
    const severedPrimary = primaryEdges.filter(
      e => offlineNodeIds.has(e.source) || offlineNodeIds.has(e.target)
    );
    const components = findConnectedComponents(
      adjacency,
      nodes.map(n => n.id),
      offlineNodeIds
    );
    return {
      totalEdges: edges.length,
      primaryActive: primaryEdges.length - severedPrimary.length,
      backupAvailable: backupEdges.length,
      severed: severedPrimary.length,
      clusters: components.length,
      components,
    };
  }, [edges, nodes, adjacency]);

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [connectionLog]);

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setConnectionLog(prev => [...prev.slice(-50), `[${timestamp}] ${msg}`]);
  };

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge({ ...params, ...primaryEdge }, eds));
      addLog(`LINK+ ${params.source} ↔ ${params.target} connected`);
    },
    [setEdges]
  );

  // ──────────────────────────────────────────────────
  // DISASTER — Tower-1, Gateway-Alpha, R1, R2, Relay-1 go offline
  // This simulates losing an entire western sector of the network.
  // ──────────────────────────────────────────────────
  const triggerDisaster = () => {
    setSimState('DISASTER');
    const offlineSet = new Set(DISASTER_OFFLINE_NODES);

    addLog('⚠ DISASTER: Western sector failure detected');
    DISASTER_OFFLINE_NODES.forEach(id => {
      const node = initialNodes.find(n => n.id === id);
      addLog(`  💀 ${node?.data.label || id} → OFFLINE`);
    });

    // Build adjacency of remaining network AFTER removing failed nodes
    const remainingEdges = initialEdges.filter(
      e => !offlineSet.has(e.source) && !offlineSet.has(e.target)
    );
    const adj = buildAdjacencyList(remainingEdges);
    const allIds = initialNodes.map(n => n.id);

    // Determine which non-offline nodes lose connectivity to HQ
    const nodesLostHQ = new Set<string>();
    for (const nodeId of allIds) {
      if (offlineSet.has(nodeId)) continue;
      const reachable = bfsReachable(adj, 'hq', nodeId, offlineSet);
      if (!reachable) {
        nodesLostHQ.add(nodeId);
      }
    }

    // Log orphaned nodes
    if (nodesLostHQ.size > 0) {
      addLog(`  🔌 ${nodesLostHQ.size} nodes lost route to HQ`);
      nodesLostHQ.forEach(id => {
        const node = initialNodes.find(n => n.id === id);
        addLog(`    ⊘ ${node?.data.label || id} — no path to Command Center`);
      });
    }

    // Update node states
    setNodes(nds =>
      nds.map(node => {
        if (offlineSet.has(node.id)) {
          return {
            ...node,
            data: { ...node.data, status: 'offline', metrics: { latency: 999, packetLoss: 100 } },
          };
        }
        if (nodesLostHQ.has(node.id)) {
          return {
            ...node,
            data: { ...node.data, status: 'offline', metrics: { latency: 999, packetLoss: 100 } },
          };
        }
        // Nodes still connected but stressed
        const path = bfsReachable(adj, 'hq', node.id, offlineSet);
        const hops = path ? path.length - 1 : 5;
        const stressedLatency = computeLatencyFromHQ(adj, node.id, offlineSet, 8);
        const stressedLoss = computePacketLoss(hops, 0.03);
        return {
          ...node,
          data: {
            ...node.data,
            metrics: { latency: stressedLatency, packetLoss: stressedLoss },
          },
        };
      })
    );

    // Update edge visuals
    setEdges(eds =>
      eds.map(edge => {
        const srcOff = offlineSet.has(edge.source) || nodesLostHQ.has(edge.source);
        const tgtOff = offlineSet.has(edge.target) || nodesLostHQ.has(edge.target);
        if (srcOff || tgtOff) {
          return {
            ...edge,
            animated: false,
            style: { stroke: '#ef4444', strokeWidth: 3, strokeDasharray: '5,5' },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#ef4444' },
          };
        }
        return edge;
      })
    );

    addLog(`📊 Network fragmented: ${findConnectedComponents(adj, allIds, offlineSet).length} clusters`);
  };

  // ──────────────────────────────────────────────────
  // SELF-HEALING (AODV-inspired)
  //
  // Algorithm:
  // 1. Accept that failed hardware nodes remain offline.
  // 2. For nodes that lost HQ path, perform BFS route discovery
  //    through ALL edges (including backup/cross-links) excluding
  //    only the hardwired-down nodes.
  // 3. Activate backup edges that appear in newly discovered paths.
  // 4. Re-compute latency/loss based on new path lengths.
  // ──────────────────────────────────────────────────
  const triggerHealing = () => {
    setSimState('HEALING');
    addLog('🔄 AODV: Initiating Route Discovery (RREQ broadcast)...');

    const offlineHardware = new Set(DISASTER_OFFLINE_NODES);

    // Phase 1: Mark orphaned nodes as "healing"
    setNodes(nds =>
      nds.map(node => {
        if (offlineHardware.has(node.id)) return node; // hardware stays offline
        if ((node.data as NodeData).status === 'offline') {
          return { ...node, data: { ...node.data, status: 'healing' } };
        }
        return node;
      })
    );

    addLog('  📡 RREQ: Scanning all available frequencies...');
    addLog('  🔍 BFS route discovery through backup & cross-links...');

    // Phase 2: After a delay, compute new routes and activate backup links
    setTimeout(() => {
      // Build full adjacency (ALL edges), excluding only dead hardware
      const fullAdj = buildAdjacencyList(initialEdges);
      const allIds = initialNodes.map(n => n.id);

      // Find new paths from HQ to every non-dead node
      const edgesInNewPaths = new Set<string>();
      const newPathMap = new Map<string, string[]>();

      for (const nodeId of allIds) {
        if (offlineHardware.has(nodeId)) continue;
        const path = bfsReachable(fullAdj, 'hq', nodeId, offlineHardware);
        if (path) {
          newPathMap.set(nodeId, path);
          // Mark every edge in the path as "active"
          for (let i = 0; i < path.length - 1; i++) {
            const a = path[i], b = path[i + 1];
            // Find the edge id for this pair
            const matchingEdge = initialEdges.find(
              e => (e.source === a && e.target === b) || (e.source === b && e.target === a)
            );
            if (matchingEdge) {
              edgesInNewPaths.add(matchingEdge.id);
            }
          }
        }
      }

      addLog('  ✅ RREP: Routes discovered!');

      // Log activated backup links
      const activatedBackups: string[] = [];
      initialEdges.forEach(e => {
        if (edgesInNewPaths.has(e.id)) {
          // Check if this was a backup/cross-link edge
          const wasBackup =
            e.style?.stroke === '#334155' ||
            e.style?.stroke === '#1e293b';
          if (wasBackup) {
            activatedBackups.push(e.id);
          }
        }
      });

      if (activatedBackups.length > 0) {
        addLog(`  🔗 Activated ${activatedBackups.length} backup route(s):`);
        activatedBackups.forEach(id => addLog(`    ↗ ${id} now active`));
      }

      // Verify connectivity
      const components = findConnectedComponents(fullAdj, allIds, offlineHardware);
      addLog(`  🌐 Network clusters: ${components.length} (should be 1 if fully healed)`);

      // Check which nodes still can't reach HQ
      const stillOrphaned: string[] = [];
      for (const nodeId of allIds) {
        if (offlineHardware.has(nodeId)) continue;
        if (!newPathMap.has(nodeId)) {
          stillOrphaned.push(nodeId);
        }
      }

      if (stillOrphaned.length > 0) {
        addLog(`  ⚠ ${stillOrphaned.length} node(s) still unreachable (hardware failure)`);
      } else {
        addLog('  ✅ All non-hardware-failed nodes now have route to HQ');
      }

      // Update node states
      setNodes(nds =>
        nds.map(node => {
          if (offlineHardware.has(node.id)) {
            return { ...node, data: { ...node.data, status: 'offline', metrics: { latency: 999, packetLoss: 100 } } };
          }
          const path = newPathMap.get(node.id);
          if (path) {
            const hops = path.length - 1;
            // Healed routes have slightly higher base latency (rerouted overhead)
            const latency = computeLatencyFromHQ(fullAdj, node.id, offlineHardware, 7);
            const loss = computePacketLoss(hops, 0.008);
            return {
              ...node,
              data: { ...node.data, status: 'online', metrics: { latency, packetLoss: loss } },
            };
          }
          // Still orphaned
          return { ...node, data: { ...node.data, status: 'offline', metrics: { latency: 999, packetLoss: 100 } } };
        })
      );

      // Update edge visuals
      setEdges(eds =>
        eds.map(edge => {
          const srcOff = offlineHardware.has(edge.source);
          const tgtOff = offlineHardware.has(edge.target);

          if (srcOff || tgtOff) {
            return {
              ...edge,
              animated: false,
              style: { stroke: '#ef4444', strokeWidth: 2, strokeDasharray: '5,5' },
              markerEnd: { type: MarkerType.ArrowClosed, color: '#ef4444' },
            };
          }

          if (edgesInNewPaths.has(edge.id)) {
            // Check if it was originally a backup
            const originalEdge = initialEdges.find(e => e.id === edge.id);
            const wasBackup =
              originalEdge?.style?.stroke === '#334155' ||
              originalEdge?.style?.stroke === '#1e293b';

            if (wasBackup) {
              // Activated backup route: amber
              return {
                ...edge,
                animated: true,
                style: { stroke: '#f59e0b', strokeWidth: 3 },
                markerEnd: { type: MarkerType.ArrowClosed, color: '#f59e0b' },
              };
            }
            // Regular active edge: green
            return {
              ...edge,
              animated: true,
              style: { stroke: '#10b981', strokeWidth: 2 },
              markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' },
            };
          }

          // Inactive edge
          return {
            ...edge,
            animated: false,
            style: { stroke: '#334155', strokeWidth: 1, strokeDasharray: '5,5' },
          };
        })
      );

      setSimState('RECOVERED');
      addLog('🎉 Self-healing complete. Network rerouted around failed sector.');
      addLog(`📊 Online: ${allIds.filter(id => !offlineHardware.has(id) && newPathMap.has(id)).length}/${totalNodes} nodes`);
    }, 3000);
  };

  const resetSimulation = () => {
    setSimState('NORMAL');
    setNodes(initialNodes);
    setEdges(initialEdges);
    setConnectionLog([]);
    addLog('🔄 Network reset to initial topology');
  };

  return (
    <div className="h-full w-full bg-[#0a0a0a] font-sans text-slate-200">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        className="bg-[#0a0a0a]"
        minZoom={0.15}
        maxZoom={4}
      >
        <Background color="#334155" gap={24} size={2} />
        <Controls className="bg-slate-900 border-slate-800 fill-slate-200" />
        <MiniMap
          nodeColor={(n) => {
            if (n.data?.status === 'offline') return '#ef4444';
            if (n.data?.status === 'healing') return '#f59e0b';
            return '#10b981';
          }}
          maskColor="rgba(10, 10, 10, 0.8)"
          className="bg-slate-900 border-slate-800"
        />

        {/* ─── SIDEBAR TOGGLE BUTTON ─── */}
        <Panel position="top-left" className="m-2">
          <AnimatePresence mode="wait">
            {!sidebarOpen && (
              <motion.button
                key="toggle-open"
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                onClick={() => setSidebarOpen(true)}
                className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/95 px-3 py-3 shadow-2xl backdrop-blur-xl transition-colors hover:border-emerald-500/50 hover:bg-slate-800"
                title="Open Control Panel"
              >
                <ChevronRight className="h-5 w-5 text-emerald-400" />
                <Network className="h-5 w-5 text-emerald-400" />
              </motion.button>
            )}
          </AnimatePresence>
        </Panel>

        {/* ─── MAIN SIDEBAR PANEL ─── */}
        <Panel position="top-left" className="m-2">
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                key="sidebar"
                initial={{ opacity: 0, x: -320, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -320, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                className="w-80 rounded-2xl border border-slate-800 bg-slate-900/95 shadow-2xl backdrop-blur-xl overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-emerald-500/20 p-2 text-emerald-400">
                      <Activity className="h-5 w-5" />
                    </div>
                    <div>
                      <h1 className="text-base font-bold tracking-tight text-white">Mesh Network</h1>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Simulation Control</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
                    title="Collapse Panel"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                </div>

                {/* Scrollable Content */}
                <div className="max-h-[calc(100vh-120px)] overflow-y-auto scrollbar-thin">
                  <div className="p-5 space-y-5">

                    {/* Status Bar */}
                    <div className="flex items-center justify-between rounded-lg bg-slate-800/60 p-3">
                      <span className="text-sm text-slate-400">Status</span>
                      <span className={`font-mono text-sm font-bold ${simState === 'NORMAL' ? 'text-emerald-400' :
                        simState === 'DISASTER' ? 'text-red-400' :
                          simState === 'HEALING' ? 'text-amber-400' : 'text-blue-400'
                        }`}>
                        {simState}
                      </span>
                    </div>

                    {/* Metrics Grid */}
                    <div>
                      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        <Gauge className="h-3.5 w-3.5" />
                        Network Metrics
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-lg bg-slate-800/50 p-3">
                          <div className="flex items-center gap-1 text-[10px] text-slate-400">
                            <Clock className="h-3 w-3" /> Avg Latency
                          </div>
                          <div className={`font-mono text-base ${metrics.avgLatency < 30 ? 'text-emerald-400' :
                            metrics.avgLatency < 80 ? 'text-amber-400' : 'text-red-400'
                            }`}>{metrics.avgLatency}ms</div>
                        </div>
                        <div className="rounded-lg bg-slate-800/50 p-3">
                          <div className="flex items-center gap-1 text-[10px] text-slate-400">
                            <WifiOff className="h-3 w-3" /> Packet Loss
                          </div>
                          <div className={`font-mono text-base ${metrics.packetLoss < 2 ? 'text-emerald-400' :
                            metrics.packetLoss < 10 ? 'text-amber-400' : 'text-red-400'
                            }`}>{metrics.packetLoss}%</div>
                        </div>
                        <div className="rounded-lg bg-slate-800/50 p-3">
                          <div className="flex items-center gap-1 text-[10px] text-slate-400">
                            <Signal className="h-3 w-3" /> Active Nodes
                          </div>
                          <div className="font-mono text-base text-white">{metrics.activeNodes}/{totalNodes}</div>
                        </div>
                        <div className="rounded-lg bg-slate-800/50 p-3">
                          <div className="flex items-center gap-1 text-[10px] text-slate-400">
                            <TrendingUp className="h-3 w-3" /> Health
                          </div>
                          <div className={`font-mono text-base ${metrics.networkHealth > 80 ? 'text-emerald-400' :
                            metrics.networkHealth > 50 ? 'text-amber-400' : 'text-red-400'
                            }`}>{metrics.networkHealth}%</div>
                        </div>
                      </div>
                    </div>

                    {/* Connection Tracking */}
                    <div>
                      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        <Network className="h-3.5 w-3.5" />
                        Connection Tracking
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between rounded-md bg-slate-800/40 px-3 py-2 text-xs">
                          <span className="text-slate-400">Total Edges</span>
                          <span className="font-mono text-slate-200">{connectionStats.totalEdges}</span>
                        </div>
                        <div className="flex items-center justify-between rounded-md bg-slate-800/40 px-3 py-2 text-xs">
                          <span className="text-slate-400">Primary Active</span>
                          <span className="font-mono text-emerald-400">{connectionStats.primaryActive}</span>
                        </div>
                        <div className="flex items-center justify-between rounded-md bg-slate-800/40 px-3 py-2 text-xs">
                          <span className="text-slate-400">Backup Available</span>
                          <span className="font-mono text-blue-400">{connectionStats.backupAvailable}</span>
                        </div>
                        <div className="flex items-center justify-between rounded-md bg-slate-800/40 px-3 py-2 text-xs">
                          <span className="text-slate-400">Severed Links</span>
                          <span className={`font-mono ${connectionStats.severed > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                            {connectionStats.severed}
                          </span>
                        </div>
                        <div className="flex items-center justify-between rounded-md bg-slate-800/40 px-3 py-2 text-xs">
                          <span className="text-slate-400">Network Clusters</span>
                          <span className={`font-mono ${connectionStats.clusters > 1 ? 'text-red-400' : 'text-emerald-400'}`}>
                            {connectionStats.clusters}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={triggerDisaster}
                        disabled={simState !== 'NORMAL'}
                        className="group flex w-full items-center justify-center gap-2 rounded-xl bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-500 transition-all hover:bg-red-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <AlertOctagon className="h-4 w-4 transition-transform group-hover:scale-110" />
                        Trigger Disaster
                      </button>

                      <button
                        onClick={triggerHealing}
                        disabled={simState !== 'DISASTER'}
                        className="group flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-500 transition-all hover:bg-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <ShieldCheck className="h-4 w-4 transition-transform group-hover:scale-110" />
                        Initiate Self-Healing
                      </button>

                      <button
                        onClick={resetSimulation}
                        className="group flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-300 transition-all hover:bg-slate-700"
                      >
                        <RotateCcw className="h-4 w-4 transition-transform group-hover:-rotate-180" />
                        Reset Network
                      </button>
                    </div>

                    {/* Network Log */}
                    <div>
                      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        <BarChart3 className="h-3.5 w-3.5" />
                        Network Log
                      </div>
                      <div
                        ref={logRef}
                        className="h-44 overflow-y-auto rounded-lg bg-black/60 p-3 font-mono text-[10px] text-slate-300 scrollbar-thin"
                      >
                        {connectionLog.length === 0 ? (
                          <div className="flex h-full items-center justify-center text-slate-600">
                            Awaiting network events...
                          </div>
                        ) : (
                          connectionLog.map((line, i) => (
                            <div key={i} className="mb-0.5 leading-relaxed">
                              {line}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Panel>

        {/* ─── BOTTOM LEGEND BAR ─── */}
        <Panel position="bottom-center" className="mb-4">
          <div className="flex flex-wrap items-center justify-center gap-4 rounded-full border border-slate-800 bg-slate-900/90 px-6 py-3 shadow-2xl backdrop-blur-xl sm:gap-6">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-emerald-500"></div>
              <span className="text-xs font-medium text-slate-300">Online</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500"></div>
              <span className="text-xs font-medium text-slate-300">Offline</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-amber-500 animate-pulse"></div>
              <span className="text-xs font-medium text-slate-300">Rerouted (AODV)</span>
            </div>
            <div className="h-4 w-[1px] bg-slate-700"></div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Zap className="h-4 w-4 text-emerald-400" />
              {totalNodes} nodes · {initialEdges.length} links
            </div>
            <div className="h-4 w-[1px] bg-slate-700"></div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              Drag nodes to rearrange
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}
