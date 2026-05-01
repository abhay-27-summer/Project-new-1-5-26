import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api, errorMessage } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import KanbanBoard from '../components/KanbanBoard.jsx';
import MembersPanel from '../components/MembersPanel.jsx';
import AddTaskModal from '../components/AddTaskModal.jsx';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [addOpen, setAddOpen] = useState(false);

  const projectQuery = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const [pr, tr] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/projects/${id}/tasks`),
      ]);
      return { project: pr.data.project, tasks: tr.data.tasks };
    },
  });

  const deleteProject = useMutation({
    mutationFn: () => api.delete(`/projects/${id}`),
    onSuccess: () => {
      toast.success('Project deleted');
      qc.invalidateQueries({ queryKey: ['projects'] });
      navigate('/projects');
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  if (projectQuery.isLoading) {
    return <div className="p-12 text-ink-500 text-sm">Loading project…</div>;
  }
  if (projectQuery.error) {
    return (
      <div className="max-w-6xl mx-auto p-12 text-center">
        <p className="text-red-600 mb-4">{errorMessage(projectQuery.error)}</p>
        <Link to="/projects" className="btn btn-outline">
          Back to projects
        </Link>
      </div>
    );
  }

  const { project, tasks } = projectQuery.data;
  const isAdmin = project.myRole === 'admin';
  const isOwner = (project.owner?.id || project.owner?._id) === user.id;

  const total = tasks.length;
  const done = tasks.filter((t) => t.status === 'done').length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <Link to="/projects" className="text-sm text-ink-500 hover:text-ink-800">
        ← All projects
      </Link>

      <div className="flex items-start justify-between mt-3 mb-2 gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-4xl tracking-tight">{project.name}</h1>
          {project.description && (
            <p className="text-ink-500 mt-2 max-w-2xl">{project.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`badge ${
              isAdmin ? 'bg-ink-900 text-ink-50' : 'bg-ink-100 text-ink-700'
            }`}
          >
            You: {project.myRole}
          </span>
          {isOwner && (
            <button
              onClick={() => {
                if (
                  confirm(
                    `Delete "${project.name}"? This will also delete all of its tasks.`
                  )
                )
                  deleteProject.mutate();
              }}
              className="btn btn-danger text-sm"
            >
              Delete project
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs text-ink-500 mb-1.5">
          <span>
            {done} of {total} tasks done
          </span>
          <span>{pct}%</span>
        </div>
        <div className="h-1.5 bg-ink-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent-500 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-6">
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-2xl">Board</h2>
            <button onClick={() => setAddOpen(true)} className="btn btn-accent text-sm">
              + New task
            </button>
          </div>
          {tasks.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="font-display text-xl mb-2">No tasks yet</p>
              <p className="text-sm text-ink-500 mb-4">
                Get started by creating your first task.
              </p>
              <button onClick={() => setAddOpen(true)} className="btn btn-primary">
                Create task
              </button>
            </div>
          ) : (
            <KanbanBoard
              tasks={tasks}
              projectId={project.id}
              isAdmin={isAdmin}
              currentUserId={user.id}
              onAdd={() => setAddOpen(true)}
            />
          )}
        </section>

        <MembersPanel project={project} isAdmin={isAdmin} currentUserId={user.id} />
      </div>

      <AddTaskModal open={addOpen} onClose={() => setAddOpen(false)} project={project} />
    </div>
  );
}
