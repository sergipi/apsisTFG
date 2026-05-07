import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import api from '../services/api';
import { DashboardCard, DashboardTitle } from './DashboardUI';

interface AnalyticsData {
  status_distribution: { status: string; count: number }[];
  department_volume: { department__name: string; count: number }[];
  sla_health: {
    met: number;
    missed: number;
    ongoing_ontime: number;
    ongoing_overdue: number;
  };
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('analytics/');
        console.log(res.data);
        setData(res.data);
      } catch (err) {
        console.error("Failed to fetch analytics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: '40px' }}><div className="loading-spinner" /></div>;
  if (!data) return <div className="empty-state">No data available</div>;

  const COLORS = ['#10b981', '#e21921'];

  const slaPieData = [
    {
      name: 'On Track',
      value: data.sla_health.met + data.sla_health.ongoing_ontime,
      fill: COLORS[0]
    },
    {
      name: 'Breached',
      value: data.sla_health.missed + data.sla_health.ongoing_overdue,
      fill: COLORS[1]
    },
  ];

  const formattedStatusData = data.status_distribution.map(item => ({
    ...item,
    status: item.status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }));

  return (
    <div className="dashboard-grid">
      <DashboardCard>
        <DashboardTitle text="SLA Health Status" />
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={slaPieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                label
              />
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </DashboardCard>

      <DashboardCard>
        <DashboardTitle text="Request Status Distribution" />
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={formattedStatusData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" fontSize={10} interval={0} angle={-15} textAnchor="end" height={60} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </DashboardCard>

      <DashboardCard>
        <DashboardTitle text="Volume by Department" />
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={data.department_volume} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="department__name" type="category" fontSize={10} width={100} />
              <Tooltip />
              <Bar dataKey="count" fill="#fff200" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </DashboardCard>
    </div>
  );
}
