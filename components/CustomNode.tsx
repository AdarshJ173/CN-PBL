import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Server, RadioTower, Router, MonitorSmartphone, AlertTriangle, CheckCircle2, Wifi, Satellite } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type NodeData = {
  label: string;
  type: 'hq' | 'tower' | 'router' | 'endpoint' | 'relay' | 'gateway';
  status: 'online' | 'offline' | 'healing';
  metrics?: {
    latency: number;
    packetLoss: number;
  };
};

export function CustomNode({ data, isConnectable }: { data: NodeData; isConnectable: boolean }) {
  const isOffline = data.status === 'offline';
  const isHealing = data.status === 'healing';

  const Icon = {
    hq: Server,
    tower: RadioTower,
    router: Router,
    endpoint: MonitorSmartphone,
    relay: Wifi,
    gateway: Satellite,
  }[data.type];

  const bgColor = isOffline
    ? 'bg-red-950/80 border-red-500/50'
    : isHealing
    ? 'bg-amber-950/80 border-amber-500/50'
    : 'bg-slate-900/80 border-emerald-500/50';

  const iconColor = isOffline
    ? 'text-red-400'
    : isHealing
    ? 'text-amber-400'
    : 'text-emerald-400';

  return (
    <div
      className={cn(
        'relative flex min-w-[130px] flex-col items-center justify-center rounded-xl border-2 p-3 shadow-xl backdrop-blur-md transition-all duration-300',
        bgColor,
        isOffline && 'opacity-70 grayscale-[0.5]'
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="h-3 w-3 border-2 border-slate-900 bg-slate-400"
      />
      
      <div className="absolute -top-3 -right-3 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900">
        {isOffline ? (
          <AlertTriangle className="h-4 w-4 text-red-500" />
        ) : isHealing ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
        ) : (
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        )}
      </div>

      <div className={cn('mb-2 rounded-full p-2 bg-slate-800/50', iconColor)}>
        <Icon className="h-5 w-5" />
      </div>

      <div className="text-center">
        <div className="font-mono text-xs font-bold text-slate-200">{data.label}</div>
        <div className="text-[9px] font-medium uppercase tracking-wider text-slate-400">
          {data.type}
        </div>
      </div>

      {data.metrics && !isOffline && (
        <div className="mt-2 flex w-full flex-col gap-1 border-t border-slate-700/50 pt-2 text-[9px] text-slate-300">
          <div className="flex justify-between">
            <span>Ping:</span>
            <span className={cn(
              'font-mono',
              data.metrics.latency < 30 ? 'text-emerald-400' : data.metrics.latency < 80 ? 'text-amber-400' : 'text-red-400'
            )}>{data.metrics.latency}ms</span>
          </div>
          <div className="flex justify-between">
            <span>Loss:</span>
            <span className={cn(
              'font-mono',
              data.metrics.packetLoss < 5 ? 'text-emerald-400' : data.metrics.packetLoss < 20 ? 'text-amber-400' : 'text-red-400'
            )}>{data.metrics.packetLoss}%</span>
          </div>
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="h-3 w-3 border-2 border-slate-900 bg-slate-400"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        isConnectable={isConnectable}
        className="h-3 w-3 border-2 border-slate-900 bg-slate-400"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        isConnectable={isConnectable}
        className="h-3 w-3 border-2 border-slate-900 bg-slate-400"
      />
    </div>
  );
}
