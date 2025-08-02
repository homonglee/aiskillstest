
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ChartData {
  name: string;
  text: string;
  정답률: number;
}

interface CorrectRateChartProps {
  data: ChartData[];
}

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-md">
                <p className="font-bold">{label}</p>
                <p className="text-sm truncate max-w-xs">{data.text}</p>
                <p className="text-primary-500">{`정답률: ${payload[0].value.toFixed(1)}%`}</p>
            </div>
        );
    }
    return null;
};


const CorrectRateChart: React.FC<CorrectRateChartProps> = ({ data }) => {
  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <BarChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis unit="%" domain={[0, 100]}/>
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="정답률" fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CorrectRateChart;
