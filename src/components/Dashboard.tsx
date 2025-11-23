'use client';

import { Email, Draft } from "@/types";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Mail, CheckCircle, Zap, PenTool } from 'lucide-react';
import { motion } from 'framer-motion';
import { useMemo } from 'react';

interface DashboardProps {
  emails: Email[];
  drafts?: Draft[];
}

export function Dashboard({ emails, drafts = [] }: DashboardProps) {
  // Memoize stats to prevent expensive recalculations on every render
  const stats = useMemo(() => {
      const totalEmails = emails.length;
      const processed = emails.filter(e => e.category).length;
      const pending = emails.reduce((acc, e) => acc + (e.actionItems?.length || 0), 0);

      const categoryData = [
        { name: 'Important', value: emails.filter(e => e.category === 'Important').length, color: '#f43f5e' },
        { name: 'To-Do', value: emails.filter(e => e.category === 'To-Do').length, color: '#f59e0b' },
        { name: 'Newsletter', value: emails.filter(e => e.category === 'Newsletter').length, color: '#10b981' },
        { name: 'Spam', value: emails.filter(e => e.category === 'Spam').length, color: '#64748b' },
      ].filter(d => d.value > 0);

      const priorityData = [
        { name: 'High', value: emails.reduce((acc, e) => acc + (e.actionItems?.filter(i => i.priority === 'High').length || 0), 0) },
        { name: 'Medium', value: emails.reduce((acc, e) => acc + (e.actionItems?.filter(i => i.priority === 'Medium').length || 0), 0) },
        { name: 'Low', value: emails.reduce((acc, e) => acc + (e.actionItems?.filter(i => i.priority === 'Low').length || 0), 0) },
      ];

      return { totalEmails, processed, pending, categoryData, priorityData };
  }, [emails]);

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto bg-slate-50/50">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500">Overview of your inbox activity</p>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 mb-8">
        {[
          { label: 'Total Emails', value: stats.totalEmails, icon: Mail, color: 'bg-blue-500' },
          { label: 'Action Items', value: stats.pending, icon: CheckCircle, color: 'bg-orange-500' },
          { label: 'Processed', value: stats.processed, icon: Zap, color: 'bg-green-500' },
          { label: 'Drafts Ready', value: drafts.length, icon: PenTool, color: 'bg-purple-500' },
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow"
          >
            <div className={`p-4 rounded-xl text-white shadow-lg ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
              <div className="text-sm text-slate-500 font-medium">{stat.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Category Distribution */}
        <motion.div 
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
        >
          <h3 className="font-bold text-slate-800 mb-6">Email Categories</h3>
          <div className="h-[300px] flex flex-col md:flex-row items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-4 md:mt-0 md:ml-8 w-full md:w-auto">
              {stats.categoryData.map((entry, i) => (
                <div key={i} className="flex items-center gap-2 text-sm justify-center md:justify-start">
                  <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: entry.color }}></div>
                  <span className="text-slate-600 font-medium">{entry.name}: {entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Task Priority */}
        <motion.div 
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ delay: 0.2 }}
           className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
        >
          <h3 className="font-bold text-slate-800 mb-6">Pending Action Items by Priority</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.priorityData}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                    cursor={{ fill: '#f8fafc' }} 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
