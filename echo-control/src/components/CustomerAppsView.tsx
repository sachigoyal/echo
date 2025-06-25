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
          <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Your Applications
          </h2>
          <p className="text-gray-400 mt-1">
            AI applications you have access to
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-gray-300">
            {apps.length} {apps.length === 1 ? 'app' : 'apps'}
          </span>
        </div>
      </div>

      {apps.length === 0 ? (
        <div className="text-center py-16 bg-gradient-to-br from-gray-900/50 to-gray-800/30 rounded-2xl border border-gray-700/50 backdrop-blur-sm">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-full blur-xl"></div>
            <ActivityIcon className="relative mx-auto h-16 w-16 text-gray-400" />
          </div>
          <h3 className="mt-6 text-lg font-semibold text-white">
            No applications
          </h3>
          <p className="mt-2 text-gray-400 max-w-sm mx-auto">
            You haven't been invited to any applications yet
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {apps.map(app => (
            <Link
              key={app.id}
              href={`/apps/${app.id}`}
              className="group relative bg-gradient-to-br from-gray-900/80 to-gray-800/40 rounded-2xl border border-gray-700/50 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10 h-64 flex flex-col"
            >
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              {/* Content */}
              <div className="relative p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors duration-300 truncate flex-1">
                        {app.name}
                      </h3>
                      <ArrowUpRightIcon className="h-4 w-4 text-gray-400 group-hover:text-blue-400 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300 flex-shrink-0" />
                    </div>
                    <div className="flex items-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          app.userRole === AppRole.ADMIN
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}
                      >
                        {app.userRole === AppRole.ADMIN ? 'Admin' : 'Customer'}
                      </span>
                    </div>
                  </div>
                </div>

                {app.description && (
                  <p className="text-gray-400 text-sm leading-relaxed mb-4 line-clamp-2">
                    {app.description}
                  </p>
                )}

                {/* Stats Grid */}
                <div className="mt-auto">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <div className="text-xl font-bold text-white">
                        {app._count.apiKeys}
                      </div>
                      <div className="text-xs text-gray-400 font-medium">
                        API Keys
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-white">
                        {app._count.llmTransactions}
                      </div>
                      <div className="text-xs text-gray-400 font-medium">
                        Transactions
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-emerald-400">
                        ${app.totalCost.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-400 font-medium">
                        Total Cost
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom gradient border */}
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
