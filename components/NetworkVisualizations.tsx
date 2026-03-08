'use client';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Activity, Network, Gauge, Signal, BarChart3, TrendingUp, Clock,
    WifiOff, Cpu, Database, Brain, ChevronDown, ChevronUp, Layers,
    AlertTriangle, Shield, Zap, Radio, Server, Router, MonitorSmartphone,
    Satellite, RadioTower, Wifi, ArrowRight, ChevronLeft
} from 'lucide-react';

// ════════════════════════════════════════════════════
// TYPES & DATA
// ════════════════════════════════════════════════════
type NodeType = 'hq' | 'gateway' | 'tower' | 'router' | 'relay' | 'endpoint';
type NodeStatus = 'online' | 'offline' | 'healing' | 'rerouted';

interface NetNode {
    id: string; label: string; type: NodeType; status: NodeStatus;
    x: number; y: number; layer: number;
    latency: number; packetLoss: number;
}

interface NetLink {
    id: string; source: string; target: string;
    kind: 'primary' | 'backup' | 'cross' | 'rerouted';
    active: boolean;
}

// Layers: HQ(0) → Gateways(1) → Towers(2) → Routers(3) → Relays(4) → Endpoints(5)
const LAYER_LABELS = ['Command Center', 'Gateways', 'Towers', 'Routers', 'Relays', 'Endpoints'];
const LAYER_COLORS = ['#a78bfa', '#60a5fa', '#34d399', '#fbbf24', '#f97316', '#f472b6'];

function makeNodes(): NetNode[] {
    const w = 900, margX = 60;
    const layers: Partial<NetNode>[][] = [
        [{ id: 'hq', label: 'Command Center', type: 'hq' }],
        [{ id: 'gw-1', label: 'Gateway Alpha', type: 'gateway' }, { id: 'gw-2', label: 'Gateway Beta', type: 'gateway' }],
        [{ id: 'tw-1', label: 'Tower West', type: 'tower' }, { id: 'tw-2', label: 'Tower Central', type: 'tower' }, { id: 'tw-3', label: 'Tower East', type: 'tower' }],
        [{ id: 'r-1', label: 'R1', type: 'router' }, { id: 'r-2', label: 'R2', type: 'router' }, { id: 'r-3', label: 'R3', type: 'router' }, { id: 'r-4', label: 'R4', type: 'router' }, { id: 'r-5', label: 'R5', type: 'router' }, { id: 'r-6', label: 'R6', type: 'router' }],
        [{ id: 'rl-1', label: 'RL1', type: 'relay' }, { id: 'rl-2', label: 'RL2', type: 'relay' }, { id: 'rl-3', label: 'RL3', type: 'relay' }, { id: 'rl-4', label: 'RL4', type: 'relay' }, { id: 'rl-5', label: 'RL5', type: 'relay' }, { id: 'rl-6', label: 'RL6', type: 'relay' }, { id: 'rl-7', label: 'RL7', type: 'relay' }],
        [{ id: 'ep-1', label: 'FU01', type: 'endpoint' }, { id: 'ep-2', label: 'FU02', type: 'endpoint' }, { id: 'ep-3', label: 'FU03', type: 'endpoint' }, { id: 'ep-4', label: 'FU04', type: 'endpoint' }, { id: 'ep-5', label: 'FU05', type: 'endpoint' }, { id: 'ep-6', label: 'FU06', type: 'endpoint' }, { id: 'ep-7', label: 'FU07', type: 'endpoint' }, { id: 'ep-8', label: 'FU08', type: 'endpoint' }],
    ];
    const nodes: NetNode[] = [];
    layers.forEach((layer, li) => {
        const count = layer.length;
        const spacing = (w - 2 * margX) / Math.max(count - 1, 1);
        layer.forEach((n, ni) => {
            nodes.push({
                ...n as NetNode, layer: li, status: 'online',
                x: count === 1 ? w / 2 : margX + ni * spacing,
                y: 40 + li * 90, latency: 5 + li * 6 + Math.random() * 4, packetLoss: li * 0.3,
            });
        });
    });
    return nodes;
}

const LINKS_DEF: [string, string, NetLink['kind']][] = [
    ['hq', 'gw-1', 'primary'], ['hq', 'gw-2', 'primary'], ['gw-1', 'gw-2', 'backup'],
    ['gw-1', 'tw-1', 'primary'], ['gw-1', 'tw-2', 'primary'], ['gw-2', 'tw-2', 'primary'], ['gw-2', 'tw-3', 'primary'],
    ['tw-1', 'tw-2', 'backup'], ['tw-2', 'tw-3', 'backup'],
    ['tw-1', 'r-1', 'primary'], ['tw-1', 'r-2', 'primary'], ['tw-2', 'r-3', 'primary'], ['tw-2', 'r-4', 'primary'], ['tw-3', 'r-5', 'primary'], ['tw-3', 'r-6', 'primary'],
    ['r-1', 'r-2', 'backup'], ['r-2', 'r-3', 'backup'], ['r-3', 'r-4', 'backup'], ['r-4', 'r-5', 'backup'], ['r-5', 'r-6', 'backup'],
    ['r-2', 'r-4', 'cross'], ['r-3', 'r-5', 'cross'],
    ['r-1', 'rl-1', 'primary'], ['r-1', 'rl-2', 'primary'], ['r-2', 'rl-2', 'primary'], ['r-2', 'rl-3', 'primary'],
    ['r-3', 'rl-3', 'primary'], ['r-3', 'rl-4', 'primary'], ['r-4', 'rl-4', 'primary'], ['r-4', 'rl-5', 'primary'],
    ['r-5', 'rl-5', 'primary'], ['r-5', 'rl-6', 'primary'], ['r-6', 'rl-6', 'primary'], ['r-6', 'rl-7', 'primary'],
    ['rl-1', 'rl-2', 'backup'], ['rl-2', 'rl-3', 'backup'], ['rl-3', 'rl-4', 'backup'], ['rl-4', 'rl-5', 'backup'], ['rl-5', 'rl-6', 'backup'], ['rl-6', 'rl-7', 'backup'],
    ['rl-1', 'ep-1', 'primary'], ['rl-1', 'ep-2', 'primary'], ['rl-2', 'ep-2', 'primary'], ['rl-2', 'ep-3', 'primary'],
    ['rl-3', 'ep-3', 'primary'], ['rl-3', 'ep-4', 'primary'], ['rl-4', 'ep-4', 'primary'], ['rl-4', 'ep-5', 'primary'],
    ['rl-5', 'ep-5', 'primary'], ['rl-5', 'ep-6', 'primary'], ['rl-6', 'ep-6', 'primary'], ['rl-6', 'ep-7', 'primary'],
    ['rl-7', 'ep-7', 'primary'], ['rl-7', 'ep-8', 'primary'],
    ['ep-1', 'ep-2', 'backup'], ['ep-3', 'ep-4', 'backup'], ['ep-5', 'ep-6', 'backup'], ['ep-7', 'ep-8', 'backup'],
];

function makeLinks(): NetLink[] {
    return LINKS_DEF.map(([s, t, k], i) => ({ id: `l-${i}`, source: s, target: t, kind: k, active: k === 'primary' }));
}

const DISASTER_NODES = new Set(['tw-1', 'gw-1', 'r-1', 'r-2', 'rl-1']);

// ════════════════════════════════════════════════════
// SVG DRAWING HELPERS
// ════════════════════════════════════════════════════
function nodeColor(status: NodeStatus): string {
    return status === 'offline' ? '#ef4444' : status === 'healing' ? '#f59e0b' : status === 'rerouted' ? '#f59e0b' : '#10b981';
}
function linkColor(kind: NetLink['kind'], active: boolean): string {
    if (!active) return '#1e293b';
    if (kind === 'rerouted') return '#f59e0b';
    if (kind === 'primary') return '#10b981';
    if (kind === 'backup') return '#334155';
    return '#1e293b';
}

// ════════════════════════════════════════════════════
// SECTION WRAPPER
// ════════════════════════════════════════════════════
function Section({ num, title, children }: { num: number; title: string; children: React.ReactNode }) {
    const [open, setOpen] = useState(true);
    return (
        <motion.section
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.5 }}
            className="rounded-2xl border border-slate-800/60 bg-[#0c0c1d]/80 backdrop-blur-xl shadow-2xl overflow-hidden"
        >
            <button onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-6 py-5 bg-gradient-to-r from-slate-900/80 to-transparent hover:from-slate-800/80 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-indigo-500/20 text-indigo-400 font-bold text-sm">{num}</span>
                    <h2 className="text-lg font-bold text-white tracking-tight">{title}</h2>
                </div>
                {open ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div className="p-6">{children}</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.section>
    );
}

// ════════════════════════════════════════════════════
// FIG 1 — NETWORK TOPOLOGY
// ════════════════════════════════════════════════════
function Fig1_Topology() {
    const nodes = useMemo(makeNodes, []);
    const links = useMemo(makeLinks, []);
    const [pulse, setPulse] = useState(0);
    useEffect(() => { const t = setInterval(() => setPulse(p => p + 1), 1200); return () => clearInterval(t); }, []);
    const nodeMap = useMemo(() => new Map(nodes.map(n => [n.id, n])), [nodes]);

    return (
        <div className="relative">
            <div className="flex flex-wrap gap-3 mb-4">
                {LAYER_LABELS.map((l, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border border-slate-700/50 bg-slate-800/40">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: LAYER_COLORS[i] }} />
                        <span className="text-slate-300">{l}</span>
                    </div>
                ))}
            </div>
            <svg viewBox="0 0 900 560" className="w-full rounded-xl bg-[#080818] border border-slate-800/40">
                <defs>
                    <filter id="glow"><feGaussianBlur stdDeviation="4" result="g" /><feMerge><feMergeNode in="g" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                    {LAYER_COLORS.map((c, i) => (
                        <radialGradient key={i} id={`ng${i}`} cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor={c} stopOpacity="0.3" /><stop offset="100%" stopColor={c} stopOpacity="0" />
                        </radialGradient>
                    ))}
                </defs>
                {/* Layer bands */}
                {LAYER_LABELS.map((_, i) => (
                    <g key={`lb-${i}`}>
                        <rect x="10" y={25 + i * 90} width="880" height="75" rx="8" fill={LAYER_COLORS[i]} fillOpacity="0.03" stroke={LAYER_COLORS[i]} strokeOpacity="0.1" strokeWidth="1" />
                        <text x="20" y={40 + i * 90} fill={LAYER_COLORS[i]} fillOpacity="0.4" fontSize="9" fontFamily="monospace">{LAYER_LABELS[i]}</text>
                    </g>
                ))}
                {/* Links */}
                {links.map(l => {
                    const s = nodeMap.get(l.source)!, t = nodeMap.get(l.target)!;
                    return (
                        <line key={l.id} x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                            stroke={linkColor(l.kind, l.active)} strokeWidth={l.active ? 1.8 : 0.8}
                            strokeDasharray={l.kind !== 'primary' ? '4,4' : undefined} opacity={l.active ? 0.8 : 0.3}
                        />
                    );
                })}
                {/* Data flow particles */}
                {links.filter(l => l.active && l.kind === 'primary').map((l, idx) => {
                    const s = nodeMap.get(l.source)!, t = nodeMap.get(l.target)!;
                    const phase = ((pulse + idx * 3) % 20) / 20;
                    return (
                        <circle key={`p-${l.id}`} cx={s.x + (t.x - s.x) * phase} cy={s.y + (t.y - s.y) * phase}
                            r="2.5" fill="#10b981" opacity={0.8} filter="url(#glow)"
                        />
                    );
                })}
                {/* Nodes */}
                {nodes.map(n => (
                    <g key={n.id}>
                        <circle cx={n.x} cy={n.y} r="20" fill={`url(#ng${n.layer})`} />
                        <circle cx={n.x} cy={n.y} r="12" fill="#0f172a" stroke={LAYER_COLORS[n.layer]} strokeWidth="2" />
                        <text x={n.x} y={n.y + 3} fill="white" fontSize="7" textAnchor="middle" fontFamily="monospace" fontWeight="bold">{n.label.substring(0, 3)}</text>
                        <text x={n.x} y={n.y + 26} fill={LAYER_COLORS[n.layer]} fontSize="7" textAnchor="middle" fontFamily="monospace" opacity="0.7">{n.label}</text>
                    </g>
                ))}
            </svg>
            <p className="mt-3 text-xs text-slate-500 italic">Figure 1: Hierarchical mesh topology — HQ → Gateways → Towers → Routers → Relays → Endpoints. Data flows animate in real-time.</p>
        </div>
    );
}

// ════════════════════════════════════════════════════
// FIG 2 — DATA PIPELINE BLOCK DIAGRAM
// ════════════════════════════════════════════════════
function Fig2_Pipeline() {
    const [step, setStep] = useState(0);
    useEffect(() => { const t = setInterval(() => setStep(s => (s + 1) % 5), 1500); return () => clearInterval(t); }, []);
    const stages = [
        { icon: Radio, label: 'Telemetry\nSampling', sub: 'RSSI · LQI · Hops', color: '#818cf8' },
        { icon: Database, label: 'Data\nCollection', sub: 'Buffer & Queue', color: '#60a5fa' },
        { icon: Cpu, label: 'Feature\nExtraction', sub: 'Normalize · Filter', color: '#34d399' },
        { icon: Activity, label: 'Simulation\nEngine', sub: 'State Update', color: '#fbbf24' },
        { icon: Network, label: 'Network\nState', sub: 'Real-time Viz', color: '#f472b6' },
    ];
    return (
        <div>
            <svg viewBox="0 0 900 200" className="w-full rounded-xl bg-[#080818] border border-slate-800/40">
                <defs><filter id="glow2"><feGaussianBlur stdDeviation="3" result="g" /><feMerge><feMergeNode in="g" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
                {stages.map((s, i) => {
                    const x = 80 + i * 185, y = 100;
                    const active = i === step;
                    return (
                        <g key={i}>
                            {i > 0 && (
                                <g>
                                    <line x1={x - 110} y1={y} x2={x - 65} y2={y} stroke={i <= step ? stages[i - 1].color : '#334155'} strokeWidth={i <= step ? 2.5 : 1.5} strokeDasharray={i <= step ? undefined : '4,4'} />
                                    <polygon points={`${x - 70},${y - 5} ${x - 60},${y} ${x - 70},${y + 5}`} fill={i <= step ? stages[i - 1].color : '#334155'} />
                                    {i <= step && (
                                        <circle cx={x - 85 + ((step * 200 + Date.now() / 20) % 30)} cy={y} r="3" fill={stages[i - 1].color} opacity="0.9" filter="url(#glow2)" />
                                    )}
                                </g>
                            )}
                            <rect x={x - 55} y={y - 45} width="110" height="90" rx="12" fill={active ? s.color + '15' : '#0f172a'} stroke={s.color} strokeWidth={active ? 2.5 : 1} strokeOpacity={active ? 1 : 0.4} />
                            <circle cx={x} cy={y - 15} r="14" fill={s.color + '20'} stroke={s.color} strokeWidth="1.5" />
                            <text x={x} y={y - 11} fill={s.color} fontSize="11" textAnchor="middle">⬡</text>
                            {s.label.split('\n').map((line, li) => (
                                <text key={li} x={x} y={y + 12 + li * 13} fill="white" fontSize="9" textAnchor="middle" fontWeight="bold" fontFamily="monospace">{line}</text>
                            ))}
                            <text x={x} y={y + 42} fill={s.color} fontSize="7" textAnchor="middle" fontFamily="monospace" opacity="0.7">{s.sub}</text>
                        </g>
                    );
                })}
            </svg>
            <p className="mt-3 text-xs text-slate-500 italic">Figure 2: Data pipeline — Telemetry sampling (RSSI, LQI, Hops) → Simulation Engine → Real-time network state update.</p>
        </div>
    );
}

// ════════════════════════════════════════════════════
// FIG 3 — DISASTER STATE
// ════════════════════════════════════════════════════
function Fig3_Disaster() {
    const nodes = useMemo(makeNodes, []);
    const links = useMemo(makeLinks, []);
    const [blinkOn, setBlink] = useState(true);
    useEffect(() => { const t = setInterval(() => setBlink(b => !b), 700); return () => clearInterval(t); }, []);
    const dNodes = useMemo(() => nodes.map(n => ({ ...n, status: (DISASTER_NODES.has(n.id) ? 'offline' : 'online') as NodeStatus })), [nodes]);
    const nodeMap = useMemo(() => new Map(dNodes.map(n => [n.id, n])), [dNodes]);

    return (
        <div>
            <div className="flex gap-3 mb-4 flex-wrap">
                <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400">
                    <AlertTriangle className="h-3 w-3" /> {DISASTER_NODES.size} nodes offline
                </div>
                <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                    <Shield className="h-3 w-3" /> {nodes.length - DISASTER_NODES.size} nodes operational
                </div>
            </div>
            <svg viewBox="0 0 900 560" className="w-full rounded-xl bg-[#080818] border border-slate-800/40">
                <defs><filter id="redGlow"><feGaussianBlur stdDeviation="6" result="g" /><feMerge><feMergeNode in="g" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
                {/* Disaster zone overlay */}
                <rect x="0" y="80" width="350" height="420" rx="16" fill="#ef4444" fillOpacity="0.04" stroke="#ef4444" strokeOpacity="0.15" strokeDasharray="8,4" />
                <text x="175" y="110" fill="#ef4444" fontSize="11" textAnchor="middle" fontFamily="monospace" fontWeight="bold" opacity="0.6">⚠ DISASTER ZONE</text>
                {/* Links */}
                {links.map(l => {
                    const s = nodeMap.get(l.source)!, t = nodeMap.get(l.target)!;
                    const broken = s.status === 'offline' || t.status === 'offline';
                    return (
                        <line key={l.id} x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                            stroke={broken ? '#ef4444' : linkColor(l.kind, l.active)} strokeWidth={broken ? 2.5 : l.active ? 1.5 : 0.8}
                            strokeDasharray={broken ? '6,4' : l.kind !== 'primary' ? '4,4' : undefined}
                            opacity={broken ? (blinkOn ? 0.7 : 0.3) : l.active ? 0.7 : 0.25}
                        />
                    );
                })}
                {/* Nodes */}
                {dNodes.map(n => {
                    const off = n.status === 'offline';
                    return (
                        <g key={n.id} opacity={off ? (blinkOn ? 0.8 : 0.4) : 1}>
                            {off && <circle cx={n.x} cy={n.y} r="22" fill="#ef4444" opacity="0.15" filter="url(#redGlow)" />}
                            <circle cx={n.x} cy={n.y} r="12" fill={off ? '#1a0000' : '#0f172a'} stroke={off ? '#ef4444' : LAYER_COLORS[n.layer]} strokeWidth="2" />
                            <text x={n.x} y={n.y + 3} fill={off ? '#ef4444' : 'white'} fontSize="7" textAnchor="middle" fontFamily="monospace" fontWeight="bold">{off ? '✕' : n.label.substring(0, 3)}</text>
                            <text x={n.x} y={n.y + 26} fill={off ? '#ef4444' : LAYER_COLORS[n.layer]} fontSize="7" textAnchor="middle" fontFamily="monospace" opacity="0.7">{n.label}</text>
                        </g>
                    );
                })}
            </svg>
            <p className="mt-3 text-xs text-slate-500 italic">Figure 3: Disaster state — Western sector failure. Red nodes/links represent offline hardware and broken primary connections.</p>
        </div>
    );
}

// ════════════════════════════════════════════════════
// FIG 4 — AODV REROUTING
// ════════════════════════════════════════════════════
function Fig4_Reroute() {
    const nodes = useMemo(makeNodes, []);
    const links = useMemo(makeLinks, []);
    const [pulse, setPulse] = useState(0);
    useEffect(() => { const t = setInterval(() => setPulse(p => p + 1), 800); return () => clearInterval(t); }, []);
    const rNodes = useMemo(() => nodes.map(n => ({ ...n, status: (DISASTER_NODES.has(n.id) ? 'offline' : 'online') as NodeStatus })), [nodes]);
    const rLinks = useMemo(() => links.map(l => {
        const sOff = DISASTER_NODES.has(l.source), tOff = DISASTER_NODES.has(l.target);
        if (sOff || tOff) return { ...l, active: false, kind: 'primary' as NetLink['kind'] };
        if (l.kind === 'backup' || l.kind === 'cross') return { ...l, active: true, kind: 'rerouted' as NetLink['kind'] };
        return l;
    }), [links]);
    const nodeMap = useMemo(() => new Map(rNodes.map(n => [n.id, n])), [rNodes]);

    return (
        <div>
            <div className="flex gap-3 mb-4 flex-wrap">
                <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400">
                    <Zap className="h-3 w-3" /> Backup links activated
                </div>
                <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                    <Shield className="h-3 w-3" /> AODV rerouting complete
                </div>
            </div>
            <svg viewBox="0 0 900 560" className="w-full rounded-xl bg-[#080818] border border-slate-800/40">
                <defs><filter id="amberGlow"><feGaussianBlur stdDeviation="4" result="g" /><feMerge><feMergeNode in="g" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
                {rLinks.map(l => {
                    const s = nodeMap.get(l.source)!, t = nodeMap.get(l.target)!;
                    const broken = s.status === 'offline' || t.status === 'offline';
                    const rerouted = l.kind === 'rerouted' && !broken;
                    return (
                        <g key={l.id}>
                            <line x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                                stroke={broken ? '#ef4444' : rerouted ? '#f59e0b' : linkColor(l.kind, l.active)}
                                strokeWidth={rerouted ? 2.5 : broken ? 1.5 : l.active ? 1.5 : 0.8}
                                strokeDasharray={broken ? '6,4' : undefined}
                                opacity={broken ? 0.3 : rerouted ? 0.9 : l.active ? 0.7 : 0.25}
                                filter={rerouted ? 'url(#amberGlow)' : undefined}
                            />
                            {rerouted && (() => {
                                const phase = ((pulse + parseInt(l.id.split('-')[1]) * 5) % 15) / 15;
                                return <circle cx={s.x + (t.x - s.x) * phase} cy={s.y + (t.y - s.y) * phase} r="3" fill="#f59e0b" filter="url(#amberGlow)" />;
                            })()}
                        </g>
                    );
                })}
                {rNodes.map(n => {
                    const off = n.status === 'offline';
                    return (
                        <g key={n.id} opacity={off ? 0.4 : 1}>
                            <circle cx={n.x} cy={n.y} r="12" fill={off ? '#1a0000' : '#0f172a'} stroke={off ? '#ef4444' : LAYER_COLORS[n.layer]} strokeWidth="2" />
                            <text x={n.x} y={n.y + 3} fill={off ? '#ef4444' : 'white'} fontSize="7" textAnchor="middle" fontFamily="monospace" fontWeight="bold">{off ? '✕' : n.label.substring(0, 3)}</text>
                        </g>
                    );
                })}
            </svg>
            <p className="mt-3 text-xs text-slate-500 italic">Figure 4: AODV rerouting — Amber links show activated backup/cross-links bypassing the failed disaster sector.</p>
        </div>
    );
}

// ════════════════════════════════════════════════════
// FIG 5 — ML ARCHITECTURE
// ════════════════════════════════════════════════════
function Fig5_ML() {
    const [step, setStep] = useState(0);
    useEffect(() => { const t = setInterval(() => setStep(s => (s + 1) % 4), 2000); return () => clearInterval(t); }, []);
    const blocks = [
        { label: 'Telemetry Data', sub: 'RSSI · LQI · Hops\nPacket Loss · Latency', color: '#818cf8', icon: '📡' },
        { label: 'Feature Extraction', sub: 'Windowed Stats\nAnomaly Scoring', color: '#34d399', icon: '⚙️' },
        { label: 'ARIMA / LSTM', sub: 'Time-Series Forecast\nPattern Recognition', color: '#f59e0b', icon: '🧠' },
        { label: 'Predictive Reroute', sub: 'Proactive Healing\nPath Optimization', color: '#f472b6', icon: '🛡️' },
    ];
    return (
        <div>
            <svg viewBox="0 0 900 220" className="w-full rounded-xl bg-[#080818] border border-slate-800/40">
                <defs><filter id="mlGlow"><feGaussianBlur stdDeviation="3" result="g" /><feMerge><feMergeNode in="g" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
                {blocks.map((b, i) => {
                    const x = 70 + i * 210, y = 110, active = i <= step;
                    return (
                        <g key={i}>
                            {i > 0 && (
                                <g>
                                    <line x1={x - 130} y1={y} x2={x - 70} y2={y} stroke={i <= step ? blocks[i - 1].color : '#334155'} strokeWidth={i <= step ? 2.5 : 1.5} />
                                    <polygon points={`${x - 75},${y - 5} ${x - 65},${y} ${x - 75},${y + 5}`} fill={i <= step ? blocks[i - 1].color : '#334155'} />
                                </g>
                            )}
                            <rect x={x - 60} y={y - 55} width="120" height="110" rx="14" fill={active ? b.color + '12' : '#0f172a'} stroke={b.color} strokeWidth={active ? 2.5 : 1} strokeOpacity={active ? 1 : 0.3} />
                            <text x={x} y={y - 28} fontSize="20" textAnchor="middle">{b.icon}</text>
                            <text x={x} y={y - 5} fill="white" fontSize="10" textAnchor="middle" fontWeight="bold" fontFamily="monospace">{b.label}</text>
                            {b.sub.split('\n').map((line, li) => (
                                <text key={li} x={x} y={y + 15 + li * 14} fill={b.color} fontSize="8" textAnchor="middle" fontFamily="monospace" opacity="0.7">{line}</text>
                            ))}
                        </g>
                    );
                })}
                <text x="450" y="200" fill="#64748b" fontSize="9" textAnchor="middle" fontFamily="monospace">Machine Learning Pipeline — Continuous Telemetry → Proactive Self-Healing</text>
            </svg>
            <p className="mt-3 text-xs text-slate-500 italic">Figure 5: ML workflow — Telemetry Data → Feature Extraction → ARIMA/LSTM Models → Predictive Reroute Engine.</p>
        </div>
    );
}

// ════════════════════════════════════════════════════
// FIG 6 — METRICS DASHBOARD
// ════════════════════════════════════════════════════
function Fig6_Metrics() {
    const [tick, setTick] = useState(0);
    useEffect(() => { const t = setInterval(() => setTick(k => k + 1), 2000); return () => clearInterval(t); }, []);
    const jitter = (base: number, range: number) => Math.round((base + (Math.sin(tick * 0.7) * range + Math.random() * range * 0.3)) * 10) / 10;
    const metrics = [
        { icon: Clock, label: 'Avg Latency', value: `${jitter(18, 4)}ms`, color: '#34d399' },
        { icon: WifiOff, label: 'Packet Loss', value: `${Math.max(0, jitter(0.8, 0.5)).toFixed(1)}%`, color: '#60a5fa' },
        { icon: Signal, label: 'Active Nodes', value: `${25 + Math.floor(Math.sin(tick * 0.3) * 2 + 2)}/30`, color: '#fbbf24' },
        { icon: TrendingUp, label: 'Health Score', value: `${Math.min(100, Math.round(92 + Math.sin(tick * 0.5) * 5))}%`, color: '#a78bfa' },
        { icon: Activity, label: 'Throughput', value: `${jitter(245, 20)} Mbps`, color: '#f472b6' },
        { icon: Gauge, label: 'Jitter', value: `${Math.max(0, jitter(2.3, 1.2)).toFixed(1)}ms`, color: '#f97316' },
    ];
    return (
        <div>
            <div className="rounded-xl border border-slate-800/60 bg-slate-900/60 overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800/60 bg-slate-900/80">
                    <div className="p-2 rounded-lg bg-emerald-500/15"><Activity className="h-5 w-5 text-emerald-400" /></div>
                    <div><h3 className="text-sm font-bold text-white">Network Metrics Dashboard</h3><p className="text-[10px] text-slate-400 uppercase tracking-wider">Live Telemetry — Refreshing every 2s</p></div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4">
                    {metrics.map((m, i) => (
                        <motion.div key={i} className="rounded-xl bg-slate-800/40 border border-slate-700/30 p-4" whileHover={{ scale: 1.03 }} transition={{ type: 'spring', stiffness: 400 }}>
                            <div className="flex items-center gap-2 mb-2">
                                <m.icon className="h-4 w-4" style={{ color: m.color }} />
                                <span className="text-[10px] uppercase tracking-wider text-slate-400">{m.label}</span>
                            </div>
                            <div className="font-mono text-xl font-bold" style={{ color: m.color }}>{m.value}</div>
                        </motion.div>
                    ))}
                </div>
                {/* Mini log */}
                <div className="mx-4 mb-4 rounded-lg bg-black/50 p-3 h-28 overflow-y-auto font-mono text-[10px] text-slate-400 scrollbar-thin">
                    {[...Array(8)].map((_, i) => {
                        const msgs = ['RREQ broadcast on mesh backbone', 'Telemetry sample collected — 30 nodes polled', 'Health score recalculated: OK', 'Latency spike on relay RL-4 (22ms)', 'Backup link gw-1↔gw-2 standby', 'Packet retransmit on ep-5', 'AODV routing table refreshed', 'Signal quality RSSI: -42dBm (Good)'];
                        return <div key={i} className="mb-0.5">[{`${String(20 + i).padStart(2, '0')}:${String((tick * 2 + i * 7) % 60).padStart(2, '0')}:${String((tick * 5 + i * 13) % 60).padStart(2, '0')}`}] {msgs[i]}</div>;
                    })}
                </div>
            </div>
            <p className="mt-3 text-xs text-slate-500 italic">Figure 6: Real-time dashboard sidebar — Network metrics with live telemetry feed.</p>
        </div>
    );
}

// ════════════════════════════════════════════════════
// FIG 7 — LINE CHART: DELAY & THROUGHPUT
// ════════════════════════════════════════════════════
function Fig7_Chart() {
    const [progress, setProgress] = useState(0);
    useEffect(() => { const t = setInterval(() => setProgress(p => Math.min(p + 1, 100)), 120); return () => clearInterval(t); }, []);

    const totalPts = 100;
    const generate = useCallback((type: 'latency' | 'throughput') => {
        const pts: number[] = [];
        for (let i = 0; i <= totalPts; i++) {
            const t = i / totalPts;
            if (type === 'latency') {
                const base = 18; const disaster = t > 0.3 && t < 0.55 ? 60 * Math.sin((t - 0.3) / 0.25 * Math.PI) : 0;
                const recovery = t >= 0.55 && t < 0.75 ? 60 * Math.sin(((0.55 - 0.3) / 0.25) * Math.PI) * (1 - (t - 0.55) / 0.2) : 0;
                pts.push(base + disaster + recovery + Math.sin(i * 0.5) * 2);
            } else {
                const base = 250; const disaster = t > 0.3 && t < 0.55 ? -180 * Math.sin((t - 0.3) / 0.25 * Math.PI) : 0;
                const recovery = t >= 0.55 && t < 0.75 ? -180 * Math.sin(((0.55 - 0.3) / 0.25) * Math.PI) * (1 - (t - 0.55) / 0.2) : 0;
                pts.push(base + disaster + recovery + Math.sin(i * 0.3) * 5);
            }
        }
        return pts;
    }, []);

    const latData = useMemo(() => generate('latency'), [generate]);
    const thrData = useMemo(() => generate('throughput'), [generate]);

    const chartW = 820, chartH = 280, padL = 60, padR = 20, padT = 30, padB = 40;
    const plotW = chartW - padL - padR, plotH = chartH - padT - padB;

    const toPath = (data: number[], maxVal: number) => {
        const visible = Math.floor(progress / 100 * totalPts);
        let d = '';
        for (let i = 0; i <= visible; i++) {
            const x = padL + (i / totalPts) * plotW;
            const y = padT + plotH - (data[i] / maxVal) * plotH;
            d += (i === 0 ? 'M' : 'L') + `${x},${y}`;
        }
        return d;
    };

    return (
        <div>
            <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full rounded-xl bg-[#080818] border border-slate-800/40">
                {/* Grid */}
                {[0, 0.25, 0.5, 0.75, 1].map(f => (
                    <g key={f}>
                        <line x1={padL} y1={padT + plotH * (1 - f)} x2={padL + plotW} y2={padT + plotH * (1 - f)} stroke="#1e293b" strokeWidth="0.5" />
                        <text x={padL - 8} y={padT + plotH * (1 - f) + 3} fill="#64748b" fontSize="8" textAnchor="end" fontFamily="monospace">{Math.round(f * 80)}</text>
                    </g>
                ))}
                {/* Phase labels */}
                <rect x={padL} y={padT - 15} width={plotW * 0.3} height="12" rx="2" fill="#10b981" fillOpacity="0.1" />
                <text x={padL + plotW * 0.15} y={padT - 6} fill="#10b981" fontSize="8" textAnchor="middle" fontFamily="monospace">Baseline</text>
                <rect x={padL + plotW * 0.3} y={padT - 15} width={plotW * 0.25} height="12" rx="2" fill="#ef4444" fillOpacity="0.15" />
                <text x={padL + plotW * 0.425} y={padT - 6} fill="#ef4444" fontSize="8" textAnchor="middle" fontFamily="monospace">Disaster Peak</text>
                <rect x={padL + plotW * 0.55} y={padT - 15} width={plotW * 0.2} height="12" rx="2" fill="#f59e0b" fillOpacity="0.1" />
                <text x={padL + plotW * 0.65} y={padT - 6} fill="#f59e0b" fontSize="8" textAnchor="middle" fontFamily="monospace">Recovery</text>
                <rect x={padL + plotW * 0.75} y={padT - 15} width={plotW * 0.25} height="12" rx="2" fill="#10b981" fillOpacity="0.1" />
                <text x={padL + plotW * 0.875} y={padT - 6} fill="#10b981" fontSize="8" textAnchor="middle" fontFamily="monospace">Recovered</text>
                {/* Axes */}
                <line x1={padL} y1={padT} x2={padL} y2={padT + plotH} stroke="#334155" strokeWidth="1" />
                <line x1={padL} y1={padT + plotH} x2={padL + plotW} y2={padT + plotH} stroke="#334155" strokeWidth="1" />
                <text x={padL + plotW / 2} y={chartH - 5} fill="#64748b" fontSize="9" textAnchor="middle" fontFamily="monospace">Time →</text>
                <text x="12" y={padT + plotH / 2} fill="#64748b" fontSize="9" textAnchor="middle" fontFamily="monospace" transform={`rotate(-90,12,${padT + plotH / 2})`}>Latency (ms) / Throughput</text>
                {/* Lines */}
                <path d={toPath(latData, 80)} fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
                <path d={toPath(thrData.map(v => v / 3.125), 80)} fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" />
                {/* Legend */}
                <circle cx={padL + plotW - 140} cy={padT + 14} r="4" fill="#ef4444" /><text x={padL + plotW - 130} y={padT + 17} fill="#ef4444" fontSize="9" fontFamily="monospace">Latency</text>
                <circle cx={padL + plotW - 60} cy={padT + 14} r="4" fill="#60a5fa" /><text x={padL + plotW - 50} y={padT + 17} fill="#60a5fa" fontSize="9" fontFamily="monospace">Throughput</text>
            </svg>
            <p className="mt-3 text-xs text-slate-500 italic">Figure 7: Delay & Throughput vs Time — Baseline → Disaster Peak → Recovery → Recovered State.</p>
        </div>
    );
}

// ════════════════════════════════════════════════════
// MAIN EXPORT
// ════════════════════════════════════════════════════
export default function NetworkVisualizations() {
    return (
        <div className="min-h-screen bg-[#060612] text-slate-200">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-slate-800/50 bg-[#060612]/90 backdrop-blur-xl">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <a href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
                            <ChevronLeft className="h-4 w-4" /> Simulator
                        </a>
                        <div className="h-5 w-px bg-slate-700" />
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30">
                                <Layers className="h-5 w-5 text-indigo-400" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-white tracking-tight">Network Visualizations</h1>
                                <p className="text-[10px] uppercase tracking-widest text-slate-500">Disaster-Resilient Mesh · Real-Time Analysis</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative h-2.5 w-2.5 rounded-full bg-emerald-500" /></span>
                        <span className="text-xs text-emerald-400 font-mono">LIVE</span>
                    </div>
                </div>
            </header>

            {/* Content */}
            <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
                <Section num={1} title="Initial Network Topology — Hierarchical Mesh Layout"><Fig1_Topology /></Section>
                <Section num={2} title="Data Pipeline — Telemetry to Simulation Engine"><Fig2_Pipeline /></Section>
                <Section num={3} title="Simulated Sector Failure — Disaster State"><Fig3_Disaster /></Section>
                <Section num={4} title="AODV Rerouting — Backup Link Activation"><Fig4_Reroute /></Section>
                <Section num={5} title="Machine Learning Workflow — Predictive Reroute Engine"><Fig5_ML /></Section>
                <Section num={6} title="Dashboard Sidebar — Live Network Metrics"><Fig6_Metrics /></Section>
                <Section num={7} title="Data Analysis — Delay & Throughput vs. Time"><Fig7_Chart /></Section>
            </div>

            {/* Footer */}
            <footer className="border-t border-slate-800/50 mt-12">
                <div className="max-w-6xl mx-auto px-6 py-6 text-center text-xs text-slate-600">
                    Disaster-Resilient Mesh Network Simulator · All visualizations generated in real-time
                </div>
            </footer>
        </div>
    );
}
