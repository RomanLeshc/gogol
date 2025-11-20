/** @format */

"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { Header } from "@/components/Header";
import { httpGetApps, handleApiError } from "@/lib/api";
import { ModelApp } from "@/lib/types";
import { toast } from "react-toastify";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface AppStats {
  totalRegistered: number;
  totalSessions: number;
  totalChats: number;
  totalApiCalls: number;
  totalFiles: number;
  totalTransactions: number;
  totalTokens: number;
}

const CHART_COLORS = {
  primary: "#6366f1",
  secondary: "#8b5cf6",
  accent: "#06b6d4",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
};

export default function StatsPage() {
  const { currentUser } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [apps, setApps] = useState<ModelApp[]>([]);
  const [aggregatedStats, setAggregatedStats] = useState<AppStats>({
    totalRegistered: 0,
    totalSessions: 0,
    totalChats: 0,
    totalApiCalls: 0,
    totalFiles: 0,
    totalTransactions: 0,
    totalTokens: 0,
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const { data } = await httpGetApps({
          limit: 10,
          offset: 0,
          order: "desc",
          orderBy: "totalRegistered",
        });

        // Handle both response formats: { apps: [...] } or { items: [...] }
        const appsData: ModelApp[] = data.apps || data.items || [];
        setApps(appsData);

        const stats = appsData.reduce(
          (acc, app) => ({
            totalRegistered:
              acc.totalRegistered + (app.stats?.totalRegistered || 0),
            totalSessions: acc.totalSessions + (app.stats?.totalSessions || 0),
            totalChats: acc.totalChats + (app.stats?.totalChats || 0),
            totalApiCalls: acc.totalApiCalls + (app.stats?.totalApiCalls || 0),
            totalFiles: acc.totalFiles + (app.stats?.totalFiles || 0),
            totalTransactions:
              acc.totalTransactions + (app.stats?.totalTransactions || 0),
            totalTokens: acc.totalTokens + (app.stats?.totalTokens || 0),
          }),
          {
            totalRegistered: 0,
            totalSessions: 0,
            totalChats: 0,
            totalApiCalls: 0,
            totalFiles: 0,
            totalTransactions: 0,
            totalTokens: 0,
          }
        );

        setAggregatedStats(stats);
      } catch (error) {
        console.error("Failed to load stats:", error);
        const apiError = handleApiError(error);
        toast.error(apiError.message || "Failed to load statistics");
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      loadStats();
    }
  }, [currentUser]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-gray-900 dark:border-gray-700 dark:border-t-gray-300"></div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  const pieData = [
    {
      name: "Users",
      value: aggregatedStats.totalRegistered,
      color: CHART_COLORS.primary,
    },
    {
      name: "Sessions",
      value: aggregatedStats.totalSessions,
      color: CHART_COLORS.secondary,
    },
    {
      name: "Chats",
      value: aggregatedStats.totalChats,
      color: CHART_COLORS.success,
    },
    {
      name: "API Calls",
      value: aggregatedStats.totalApiCalls,
      color: CHART_COLORS.warning,
    },
    {
      name: "Files",
      value: aggregatedStats.totalFiles,
      color: CHART_COLORS.danger,
    },
  ];

  const barData = apps.slice(0, 5).map((app) => ({
    name:
      app.displayName.length > 15
        ? app.displayName.substring(0, 15) + "..."
        : app.displayName,
    users: app.stats?.totalRegistered || 0,
    sessions: app.stats?.totalSessions || 0,
    chats: app.stats?.totalChats || 0,
    apiCalls: app.stats?.totalApiCalls || 0,
    files: app.stats?.totalFiles || 0,
  }));

  const statCards = [
    {
      title: "Total Users",
      value: aggregatedStats.totalRegistered.toLocaleString(),
      color: CHART_COLORS.primary,
    },
    {
      title: "Sessions",
      value: aggregatedStats.totalSessions.toLocaleString(),
      color: CHART_COLORS.secondary,
    },
    {
      title: "Chats",
      value: aggregatedStats.totalChats.toLocaleString(),
      color: CHART_COLORS.success,
    },
    {
      title: "API Calls",
      value: aggregatedStats.totalApiCalls.toLocaleString(),
      color: CHART_COLORS.warning,
    },
    {
      title: "Files",
      value: aggregatedStats.totalFiles.toLocaleString(),
      color: CHART_COLORS.danger,
    },
    {
      title: "AI Tokens",
      value: aggregatedStats.totalTokens.toLocaleString(),
      color: CHART_COLORS.accent,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
            Analytics
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Platform statistics and metrics overview
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {statCards.map((card) => (
            <div
              key={card.title}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {card.title}
                  </p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {card.value}
                  </p>
                </div>
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${card.color}15` }}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: card.color }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Pie Chart */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Distribution Overview
            </h2>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => {
                    const pct = percent ?? 0;
                    return pct > 0.05
                      ? `${name}: ${(pct * 100).toFixed(0)}%`
                      : "";
                  }}
                  outerRadius={90}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                    color: "#111827",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart - Top Apps */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Top Apps by Users
            </h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  stroke="#6b7280"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                    color: "#111827",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Bar
                  dataKey="users"
                  fill={CHART_COLORS.primary}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="sessions"
                  fill={CHART_COLORS.secondary}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Metrics Chart */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Metrics Comparison
          </h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="name"
                stroke="#6b7280"
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  color: "#111827",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Bar
                dataKey="users"
                fill={CHART_COLORS.primary}
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="sessions"
                fill={CHART_COLORS.secondary}
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="chats"
                fill={CHART_COLORS.success}
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="apiCalls"
                fill={CHART_COLORS.warning}
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="files"
                fill={CHART_COLORS.danger}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Apps Table */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            All Apps
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    App Name
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Users
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Sessions
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Chats
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    API Calls
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Files
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {apps.map((app) => (
                  <tr
                    key={app._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white font-medium">
                      {app.displayName}
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-gray-600 dark:text-gray-400">
                      {(app.stats?.totalRegistered || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-gray-600 dark:text-gray-400">
                      {(app.stats?.totalSessions || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-gray-600 dark:text-gray-400">
                      {(app.stats?.totalChats || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-gray-600 dark:text-gray-400">
                      {(app.stats?.totalApiCalls || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-gray-600 dark:text-gray-400">
                      {(app.stats?.totalFiles || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
