interface Props {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

export default function ChartCard({ title, action, children }: Props) {
  return (
    <div className="glass neon-border rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {action}
      </div>
      <div className="h-64 w-full">{children}</div>
    </div>
  );
}

