import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { WalletHistory } from '../../types';

interface Props { data: WalletHistory[]; }

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card px-3 py-2 text-xs">
        <p className="text-text-secondary mb-1">{label}</p>
        <p className="text-neon-green font-semibold">₪{payload[0].value.toFixed(2)}</p>
      </div>
    );
  }
  return null;
};

export default function SavingsChart({ data }: Props) {
  const chartData = data.slice(-14).map(d => ({
    date: new Date(d.date).toLocaleDateString('en-IL', { month: 'short', day: 'numeric' }),
    amount: d.daily_total,
  }));

  return (
    <ResponsiveContainer width="100%" height={120}>
      <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#00C896" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#00C896" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="date" tick={{ fill: '#4A4D6B', fontSize: 9 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
        <YAxis tick={{ fill: '#4A4D6B', fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₪${v}`} />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="amount" stroke="#00C896" strokeWidth={2} fill="url(#savingsGradient)" dot={false} activeDot={{ r: 4, fill: '#00C896' }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
