import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { CardBreakdown } from '../../types';

interface Props { data: CardBreakdown[]; }

const COLORS = ['#7C5CFC', '#00C896', '#FF6B9D', '#00D4FF', '#F59E0B', '#EF4444'];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card px-3 py-2 text-xs">
        <p className="text-white font-medium">{payload[0].name}</p>
        <p className="text-neon-purple">₪{payload[0].value.toFixed(2)}</p>
      </div>
    );
  }
  return null;
};

export default function DonutChart({ data }: Props) {
  const chartData = data.map(d => ({ name: d.nickname || `••••${d.last_four}`, value: d.total_saved }));
  if (!chartData.length || chartData.every(d => d.value === 0)) {
    return <div className="flex items-center justify-center h-[120px]"><p className="text-text-muted text-xs">No data yet</p></div>;
  }
  return (
    <ResponsiveContainer width="100%" height={120}>
      <PieChart>
        <Pie data={chartData} cx="50%" cy="50%" innerRadius={30} outerRadius={50} paddingAngle={3} dataKey="value" stroke="none">
          {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
      </PieChart>
    </ResponsiveContainer>
  );
}
