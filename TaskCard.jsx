import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client.js';

const StatCard = ({ label, value, accent }) => (
  <div className="card p-5">
    <div className="text-xs uppercase tracking-wider text-ink-500">{label}</div>
    <div className={`mt-2 font-display text-4xl ${accent || 'text-ink-900'}`}>{value}</div>
  </div>
);

const formatDue = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  const now = new Date();
  const diff = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  if (diff === 0) return 'Due today';
  if (diff === 1) return 'Due tomorrow';
  return `In ${diff}d`;
};

const StatusBadge = ({ status }) => {
  const styles = {
    todo: 'bg-ink-100 text-ink-700',
    in_progress: 'bg-accent-100 text-accent-700',
    done: 'bg-emerald-100 text-emerald-700',
  };
  const labels = { todo: 'To do', in_progress: 'In progress', done: 'Done' };
  return <span className={`badge ${styles[status]}`}>{labels[status]}</span>;
};

export default function Dashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => (await api.get('/dashboard')).data,
  });

  if (isLoading) return <div className="p-12 text-ink-500 text-sm">Loading dashboard…</div>;
  if (error) return <div className="p-12 text-red-600 text-sm">Failed to load dashboard.</div>;

  const { summary, myTasks, overdueTasks } = data;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="mb-10">
        <h1 className="font-display text-4xl tracking-tight">Dashboard</h1>
        <p className="text-ink-500 mt-1">A snapshot of your work.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatCard label="Projects" value={summary.projectCount} />
        <StatCard label="My tasks" value={summary.myTaskCount} />
        <StatCard
          label="Overdue"
          value={summary.overdueCount}
          accent={summary.overdueCount > 0 ? 'text-accent-500' : ''}
        />
        <StatCard label="Done" value={summary.myStatusCounts.done} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <section className="card p-6">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-display text-2xl">Overdue</h2>
            <span className="text-xs text-ink-500">{overdueTasks.length} items</span>
          </div>
          {overdueTasks.length === 0 ? (
            <p className="text-sm text-ink-500 italic">Nothing overdue. Nice.</p>
          ) : (
            <ul className="divide-y divide-ink-100">
              {overdueTasks.map((t) => (
                <li key={t.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      to={`/projects/${t.project._id || t.project}`}
                      className="text-sm font-medium text-ink-800 hover:text-ink-900 truncate block"
                    >
                      {t.title}
                    </Link>
                    <p className="text-xs text-ink-500 truncate">
                      {t.project?.name || ''} · {formatDue(t.dueDate)}
                    </p>
                  </div>
                  <StatusBadge status={t.status} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-6">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-display text-2xl">My tasks</h2>
            <span className="text-xs text-ink-500">{myTasks.length} assigned</span>
          </div>
          {myTasks.length === 0 ? (
            <p className="text-sm text-ink-500 italic">
              No tasks assigned to you yet.
            </p>
          ) : (
            <ul className="divide-y divide-ink-100">
              {myTasks.slice(0, 8).map((t) => (
                <li key={t.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      to={`/projects/${t.project._id || t.project}`}
                      className="text-sm font-medium text-ink-800 hover:text-ink-900 truncate block"
                    >
                      {t.title}
                    </Link>
                    <p className="text-xs text-ink-500 truncate">
                      {t.project?.name || ''} · {formatDue(t.dueDate)}
                    </p>
                  </div>
                  <StatusBadge status={t.status} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
