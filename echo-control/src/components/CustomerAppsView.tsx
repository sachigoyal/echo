'use client';

import Link from 'next/link';
import { ActivityIcon, ArrowUpRightIcon } from 'lucide-react';
import { AppRole } from '@/lib/permissions/types';

interface EchoAppWithRole {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  totalTokens: number;
  totalCost: number;
  userRole: AppRole;
  permissions?: unknown;
  _count: {
    apiKeys: number;
    llmTransactions: number;
  };
}

interface CustomerAppsViewProps {
  apps: EchoAppWithRole[];
  onRefresh?: () => void;
}

export default function CustomerAppsView({ apps }: CustomerAppsViewProps) {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Your Applications
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">
            AI applications you have access to
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="h-2 w-2 bg-secondary rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
            {apps.length} {apps.length === 1 ? 'app' : 'apps'}
          </span>
        </div>
      </div>

      {apps.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-xl shadow-sm">
          <div className="relative">
            <div className="absolute inset-0 bg-secondary/5 rounded-full blur-xl"></div>
            <ActivityIcon className="relative mx-auto h-16 w-16 text-zinc-400" />
          </div>
          <h3 className="mt-6 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            No applications
          </h3>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400 max-w-sm mx-auto">
            You haven&apos;t been invited to any applications yet
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {apps.map(app => (
            <Link
              key={app.id}
              href={`/apps/${app.id}`}
              className="group relative bg-card border border-border rounded-xl shadow-lg shadow-zinc-100/50 dark:shadow-zinc-900/30 overflow-hidden transition-all duration-300 hover:border-secondary/50 hover:shadow-xl hover:shadow-secondary/10 hover:-translate-y-1 h-64 flex flex-col"
            >
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              {/* Content */}
              <div className="relative p-6 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-secondary transition-colors duration-300 truncate flex-1">
                        {app.name}
                      </h3>
                      <ArrowUpRightIcon className="h-4 w-4 text-zinc-400 group-hover:text-secondary transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300 flex-shrink-0" />
                    </div>
                    <div className="flex items-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          app.userRole === AppRole.ADMIN
                            ? 'bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                            : 'bg-secondary/10 text-secondary border-secondary/20'
                        }`}
                      >
                        {app.userRole === AppRole.ADMIN ? 'Admin' : 'Customer'}
                      </span>
                    </div>
                  </div>
                </div>

                {app.description && (
                  <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed mb-4 line-clamp-2">
                    {app.description}
                  </p>
                )}

                {/* Stats Grid */}
                <div className="mt-auto">
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
                    <div className="text-center">
                      <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                        {app._count.apiKeys}
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                        API Keys
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                        {app._count.llmTransactions}
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                        Transactions
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                        ${app.totalCost.toFixed(2)}
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                        Total Cost
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom accent line */}
              <div className="absolute bottom-0 left-0 right-0 h-px bg-secondary opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
