import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "../../../app/i18n/LanguageContext";
import { pickLang } from "../../../app/i18n/pickLang";
import { useAuth } from "../../../app/context/AuthContext";
import { useBranch } from "../../../app/context/BranchContext";
import { useConfirm } from "../../../app/context/ConfirmContext";
import { useModulePermissions } from "../../../app/hooks/useModulePermissions";
import { useBranchRevision } from "../../../app/hooks/useBranchRevision";
import { useServerPagination, DEFAULT_LIST_PAGE_SIZE } from "../../../app/hooks/usePagination";
import {
  createTask,
  deleteTask as apiDeleteTask,
  fetchTaskAssignees,
  fetchTasks,
  updateTask,
  type TaskAssignee,
  type TaskPriorityUi,
  type TaskRow,
  type TaskStatusUi,
} from "../../../app/api/tasks";
import { notifyFromError, notifySuccess } from "../../../app/lib/toast";
import { DataPagination, dataPaginationShowText } from "../../../app/components/ui/DataPagination";
import { FilterSelect } from "../ui/filter-select";
import {
  Search,
  Plus,
  Grid3X3,
  List,
  X,
  Edit2,
  Trash2,
  Check,
  Eye,
  ChevronDown,
  Calendar,
  User,
  AlignLeft,
} from "lucide-react";

type Priority = TaskPriorityUi;
type Status = TaskStatusUi;

type Task = TaskRow & { assigneeName: string };

const priorityBadge: Record<Priority, string> = {
  High: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800",
  Medium:
    "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800",
  Low: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800",
};

const statusBadge: Record<Status, string> = {
  "To Do": "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600",
  "In Progress":
    "bg-blue-100 dark:bg-[#14b8a6]/20 text-blue-700 dark:text-[#14b8a6] border border-blue-200 dark:border-[#14b8a6]/40",
  Review:
    "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800",
  Done: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800",
};

const statusDot: Record<Status, string> = {
  "To Do": "bg-gray-400",
  "In Progress": "bg-blue-500",
  Review: "bg-purple-500",
  Done: "bg-emerald-500",
};

const columnOrder: Status[] = ["To Do", "In Progress", "Review", "Done"];

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function getInitials(name: string): string {
  return (
    name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  );
}

function mapRow(row: TaskRow): Task {
  return { ...row, assigneeName: row.assignee?.name ?? "—" };
}

function StatusDropdown({
  status,
  language,
  onChange,
  disabled,
}: {
  status: Status;
  language: string;
  onChange: (s: Status) => void;
  disabled?: boolean;
}) {
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || dropRef.current?.contains(t)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const options: { value: Status; label: string }[] = [
    { value: "To Do", label: tr("Gözləmədə", "To Do") },
    { value: "In Progress", label: tr("İcrada", "In Progress") },
    { value: "Review", label: tr("Yoxlamada", "Review") },
    { value: "Done", label: tr("Tamamlandı", "Done") },
  ];

  function handleOpen() {
    if (disabled) return;
    if (!open && btnRef.current) setRect(btnRef.current.getBoundingClientRect());
    setOpen((v) => !v);
  }

  const currentLabel = options.find((o) => o.value === status)?.label ?? status;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        onClick={handleOpen}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-all ${statusBadge[status]} ${
          disabled ? "opacity-60 cursor-default" : "cursor-pointer hover:opacity-80 active:scale-95"
        }`}
      >
        <span>{currentLabel}</span>
        {!disabled && <ChevronDown className="w-2.5 h-2.5 opacity-50" />}
      </button>

      {open && rect &&
        createPortal(
          <div
            ref={dropRef}
            style={{ position: "fixed", top: rect.bottom + 4, left: rect.left, zIndex: 99999 }}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl py-1.5 w-44 overflow-hidden"
          >
            <p className="px-3 pb-1 text-[9px] font-semibold text-gray-400 uppercase tracking-wider">
              {tr("Statusu dəyişdir", "Change status")}
            </p>
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full text-left flex items-center gap-2.5 px-3 py-1.5 text-xs transition-colors ${
                  opt.value === status ? "bg-gray-50 dark:bg-gray-800" : "hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDot[opt.value]}`} />
                <span className="flex-1 text-gray-700 dark:text-gray-300">{opt.label}</span>
                {opt.value === status && (
                  <Check className="w-3 h-3 text-[#14b8a6] dark:text-[#14b8a6] flex-shrink-0" />
                )}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}

function TaskRow({
  task,
  index,
  isDone,
  language,
  canEdit,
  canDelete,
  isDemo,
  onView,
  onEdit,
  onToggle,
  onDelete,
  onStatusChange,
}: {
  task: Task;
  index: number;
  isDone: boolean;
  language: string;
  canEdit: boolean;
  canDelete: boolean;
  isDemo: boolean;
  onView: (t: Task) => void;
  onEdit: (t: Task) => void;
  onToggle: (id: string, done: boolean) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: Status) => void;
}) {
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);
  const priorityLabel: Record<Priority, string> = {
    High: tr("Yüksək", "High"),
    Medium: tr("Orta", "Medium"),
    Low: tr("Aşağı", "Low"),
  };
  const mutateOk = canEdit && !isDemo;

  return (
    <tr
      className={`border-b border-gray-200 dark:border-gray-800 ${
        isDone
          ? "bg-green-50/40 dark:bg-green-900/10"
          : index % 2 === 0
            ? "bg-white dark:bg-gray-900"
            : "bg-gray-50 dark:bg-gray-800/30"
      }`}
    >
      <td className="px-3 py-2 w-8">
        <button
          type="button"
          disabled={!mutateOk}
          onClick={() => onToggle(task.id, isDone)}
          title={
            isDone
              ? tr("Tamamlanmamış kimi işarələ", "Mark incomplete")
              : tr("Tamamlanmış kimi işarələ", "Mark complete")
          }
          className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
            isDone
              ? "border-emerald-500 bg-emerald-500"
              : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 hover:border-emerald-400"
          } disabled:opacity-50`}
        >
          {isDone && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
        </button>
      </td>
      <td className="px-3 py-2 whitespace-nowrap max-w-[220px]">
        <span
          className={`text-xs block truncate ${
            isDone ? "line-through text-gray-400 dark:text-gray-500" : "text-gray-900 dark:text-white"
          }`}
        >
          {task.title}
        </span>
      </td>
      <td className="px-3 py-2 whitespace-nowrap">
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${priorityBadge[task.priority]}`}>
          {priorityLabel[task.priority]}
        </span>
      </td>
      <td className="px-3 py-2 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center text-gray-700 dark:text-gray-200 text-[10px] font-bold flex-shrink-0">
            {getInitials(task.assigneeName)}
          </div>
          <p className="text-xs text-gray-900 dark:text-white whitespace-nowrap">{task.assigneeName}</p>
        </div>
      </td>
      <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
        {formatDate(task.dueDate)}
      </td>
      <td className="px-3 py-2 whitespace-nowrap">
        <StatusDropdown
          status={task.status}
          language={language}
          disabled={!mutateOk}
          onChange={(s) => onStatusChange(task.id, s)}
        />
      </td>
      <td className="px-3 py-2 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onView(task)}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            title={tr("Bax", "View")}
          >
            <Eye className="w-3 h-3" />
          </button>
          {mutateOk && (
            <button
              type="button"
              onClick={() => onEdit(task)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              title={tr("Redaktə et", "Edit")}
            >
              <Edit2 className="w-3 h-3" />
            </button>
          )}
          {canDelete && !isDemo && (
            <button
              type="button"
              onClick={() => onDelete(task.id)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title={tr("Sil", "Delete")}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

export function Tasks() {
  const { language } = useLanguage();
  const { isDemo, isAuthenticated, user } = useAuth();
  const { isGlobalMode, branchId } = useBranch();
  const branchRevision = useBranchRevision();
  const askConfirm = useConfirm();
  const { canView, canCreate, canEdit, canDelete } = useModulePermissions("Tasks");
  const isOwner = !!user?.isTenantOwner;
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  const priorityLabel: Record<Priority, string> = {
    High: tr("Yüksək", "High"),
    Medium: tr("Orta", "Medium"),
    Low: tr("Aşağı", "Low"),
  };
  const statusLabel: Record<Status, string> = {
    "To Do": tr("Gözləmədə", "To Do"),
    "In Progress": tr("İcrada", "In Progress"),
    Review: tr("Yoxlamada", "Review"),
    Done: tr("Tamamlandı", "Done"),
  };

  const [tasks, setTasks] = useState<Task[]>([]);
  const [assignees, setAssignees] = useState<TaskAssignee[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState<"board" | "list">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState<Priority | "All">("All");
  const [filterStatus, setFilterStatus] = useState<Status | "All">("All");
  const [filterAssignee, setFilterAssignee] = useState("All");
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "Medium" as Priority,
    status: "To Do" as Status,
    assigneeUserId: "",
    dueDate: new Date().toISOString().slice(0, 10),
  });

  const {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    setCurrentPage,
    setTotals,
    resetToFirstPage,
  } = useServerPagination(DEFAULT_LIST_PAGE_SIZE);

  const needsBranch = isGlobalMode && !branchId;
  const canMutate = !isDemo && !needsBranch;

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    resetToFirstPage();
  }, [debouncedSearch, filterPriority, filterStatus, filterAssignee, view, branchRevision, resetToFirstPage]);

  const loadAssignees = useCallback(async () => {
    if (!(isAuthenticated || isDemo) || !canView || needsBranch) {
      setAssignees([]);
      return;
    }
    try {
      const rows = await fetchTaskAssignees();
      setAssignees(rows);
    } catch {
      setAssignees([]);
    }
  }, [isAuthenticated, isDemo, canView, needsBranch, branchRevision]);

  const loadTasks = useCallback(async () => {
    if (!(isAuthenticated || isDemo) || !canView) {
      setTasks([]);
      setTotals(0, 1);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const pageSize = view === "board" ? 200 : itemsPerPage;
      const page = view === "board" ? 1 : currentPage;
      const result = await fetchTasks({
        search: debouncedSearch.trim() || undefined,
        status: filterStatus === "All" ? "all" : filterStatus,
        priority: filterPriority === "All" ? "all" : filterPriority,
        assigneeUserId:
          isOwner && filterAssignee !== "All" ? filterAssignee : undefined,
        page,
        pageSize,
      });
      setTasks((Array.isArray(result.items) ? result.items : []).map(mapRow));
      setTotals(result.total ?? 0, result.totalPages);
    } catch (err) {
      notifyFromError(err, tr("Tapşırıqları yükləmək alınmadı", "Failed to load tasks"));
      setTasks([]);
      setTotals(0, 1);
    } finally {
      setLoading(false);
    }
  }, [
    isAuthenticated,
    isDemo,
    canView,
    debouncedSearch,
    filterPriority,
    filterStatus,
    filterAssignee,
    isOwner,
    view,
    currentPage,
    itemsPerPage,
    setTotals,
    branchRevision,
  ]);

  useEffect(() => {
    void loadAssignees();
  }, [loadAssignees]);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  const tasksByStatus = useCallback(
    (status: Status) => tasks.filter((t) => t.status === status),
    [tasks],
  );

  function openAdd() {
    if (!canCreate || !canMutate) {
      if (needsBranch) {
        notifyFromError(
          new Error(tr("Tapşırıq yaratmaq üçün filial seçin", "Select a branch to create tasks")),
        );
      }
      return;
    }
    setEditingTask(null);
    setForm({
      title: "",
      description: "",
      priority: "Medium",
      status: "To Do",
      assigneeUserId: assignees[0]?.id ?? user?.id ?? "",
      dueDate: new Date().toISOString().slice(0, 10),
    });
    setIsModalOpen(true);
  }

  function openEdit(task: Task) {
    if (!canEdit || isDemo) return;
    setEditingTask(task);
    setForm({
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      assigneeUserId: task.assigneeUserId,
      dueDate: task.dueDate ?? "",
    });
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingTask(null);
  }

  async function saveTask() {
    if (!form.title.trim() || !form.assigneeUserId || saving) return;
    if (!canMutate) {
      notifyFromError(
        new Error(tr("Tapşırıq yaratmaq üçün filial seçin", "Select a branch to create tasks")),
      );
      return;
    }
    setSaving(true);
    try {
      const body = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        priority: form.priority,
        status: form.status,
        assigneeUserId: form.assigneeUserId,
        dueDate: form.dueDate || null,
      };
      if (editingTask) {
        await updateTask(editingTask.id, body);
        notifySuccess(tr("Tapşırıq yeniləndi", "Task updated"));
      } else {
        await createTask(body);
        notifySuccess(tr("Tapşırıq yaradıldı", "Task created"));
      }
      closeModal();
      await loadTasks();
    } catch (err) {
      notifyFromError(err, tr("Saxlamaq alınmadı", "Failed to save task"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string): Promise<boolean> {
    if (!canDelete || isDemo) return false;
    if (
      !(await askConfirm({
        title: tr("Silmə təsdiqi", "Confirm deletion"),
        message: tr("Bu tapşırığı silmək istədiyinizə əminsiniz?", "Are you sure you want to delete this task?"),
        variant: "danger",
      }))
    ) {
      return false;
    }
    try {
      await apiDeleteTask(id);
      notifySuccess(tr("Tapşırıq silindi", "Task deleted"));
      if (viewingTask?.id === id) setViewingTask(null);
      await loadTasks();
      return true;
    } catch (err) {
      notifyFromError(err, tr("Silmək alınmadı", "Failed to delete task"));
      return false;
    }
  }

  async function toggleTask(id: string, currentlyDone: boolean) {
    if (!canEdit || isDemo) return;
    try {
      await updateTask(id, { status: currentlyDone ? "To Do" : "Done" });
      await loadTasks();
    } catch (err) {
      notifyFromError(err, tr("Status yenilənmədi", "Failed to update status"));
    }
  }

  async function changeStatus(id: string, status: Status) {
    if (!canEdit || isDemo) return;
    try {
      await updateTask(id, { status });
      await loadTasks();
    } catch (err) {
      notifyFromError(err, tr("Status yenilənmədi", "Failed to update status"));
    }
  }

  const inp =
    "w-full px-2.5 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6] transition-colors";
  const lbl = "block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1";

  if (!canView) {
    return (
      <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950 p-6">
        <p className="text-sm text-gray-500">{tr("İcazə yoxdur", "No permission")}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4">
        <div className="mb-4">
          <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white">
            {tr("Tapşırıqlar", "Tasks")}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {tr("Komanda tapşırıqlarını idarə edin", "Manage team tasks and progress")}
          </p>
        </div>

        <div className="flex justify-end gap-2 mb-4">
          <button
            type="button"
            onClick={() => setView("board")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg font-medium transition-colors ${
              view === "board"
                ? "bg-[#14b8a6] text-white border border-[#14b8a6]"
                : "bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
            title={tr("Lövhə görünüşü", "Board view")}
          >
            <Grid3X3 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg font-medium transition-colors ${
              view === "list"
                ? "bg-[#14b8a6] text-white border border-[#14b8a6]"
                : "bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
            title={tr("Siyahı görünüşü", "List view")}
          >
            <List className="w-3.5 h-3.5" />
          </button>
          {canCreate && !isDemo && (
            <button
              type="button"
              onClick={openAdd}
              disabled={needsBranch}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-[#14b8a6] hover:bg-[#0d9488] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{tr("Tapşırıq Əlavə Et", "Add Task")}</span>
            </button>
          )}
        </div>

        {needsBranch && (
          <p className="mb-3 text-xs text-amber-600 dark:text-amber-400">
            {tr(
              "Tapşırıq yaratmaq və ya icraçı seçmək üçün filial seçin.",
              "Select a branch to create tasks or choose assignees.",
            )}
          </p>
        )}

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 mb-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="flex-1 relative max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder={tr("Tapşırıq axtar...", "Search tasks...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
              />
            </div>
            <div className="flex gap-2 ml-auto flex-wrap">
              <FilterSelect
                value={filterPriority}
                onChange={(v) => setFilterPriority(v as Priority | "All")}
                options={[
                  { value: "All", label: tr("Prioritet", "Priority") },
                  { value: "High", label: tr("Yüksək", "High") },
                  { value: "Medium", label: tr("Orta", "Medium") },
                  { value: "Low", label: tr("Aşağı", "Low") },
                ]}
              />
              <FilterSelect
                value={filterStatus}
                onChange={(v) => setFilterStatus(v as Status | "All")}
                options={[
                  { value: "All", label: tr("Status", "Status") },
                  { value: "To Do", label: tr("Gözləmədə", "To Do") },
                  { value: "In Progress", label: tr("İcrada", "In Progress") },
                  { value: "Review", label: tr("Yoxlamada", "Review") },
                  { value: "Done", label: tr("Tamamlandı", "Done") },
                ]}
              />
              {isOwner && (
                <FilterSelect
                  value={filterAssignee}
                  onChange={setFilterAssignee}
                  options={[
                    { value: "All", label: tr("İcraçı", "Assignee") },
                    ...assignees.map((e) => ({ value: e.id, label: e.name })),
                  ]}
                />
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <p className="text-xs text-gray-400 py-8 text-center">{tr("Yüklənir...", "Loading...")}</p>
        ) : (
          <>
            {view === "board" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {columnOrder.map((col) => {
                  const colTasks = tasksByStatus(col);
                  return (
                    <div
                      key={col}
                      className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden"
                    >
                      <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${statusDot[col]}`} />
                          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                            {statusLabel[col]}
                          </span>
                        </div>
                        <span className="text-[10px] font-medium bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded">
                          {colTasks.length}
                        </span>
                      </div>
                      <div className="p-2 space-y-2">
                        {colTasks.map((task) => (
                          <div
                            key={task.id}
                            onClick={() => (canEdit && !isDemo ? openEdit(task) : setViewingTask(task))}
                            className="bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 cursor-pointer hover:border-[#14b8a6]/30 transition-colors"
                          >
                            <p className="text-xs font-medium text-gray-900 dark:text-white mb-2">{task.title}</p>
                            <span
                              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${priorityBadge[task.priority]}`}
                            >
                              {priorityLabel[task.priority]}
                            </span>
                            <div className="flex items-center justify-between mt-2">
                              <div
                                className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center text-gray-700 dark:text-gray-200 text-[10px] font-bold flex-shrink-0"
                                title={task.assigneeName}
                              >
                                {getInitials(task.assigneeName)}
                              </div>
                              <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                {formatDate(task.dueDate)}
                              </span>
                            </div>
                          </div>
                        ))}
                        {colTasks.length === 0 && (
                          <p className="text-[10px] text-gray-400 dark:text-gray-600 text-center py-4">
                            {tr("Tapşırıq yoxdur", "No tasks")}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {view === "list" && (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                        <th className="px-3 py-2 w-8" />
                        <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                          {tr("TAPŞIRIQ", "TASK")}
                        </th>
                        <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                          {tr("PRİORİTET", "PRIORITY")}
                        </th>
                        <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                          {tr("İCRAÇI", "ASSIGNEE")}
                        </th>
                        <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                          {tr("SON TARİX", "DUE DATE")}
                        </th>
                        <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                          {tr("STATUS", "STATUS")}
                        </th>
                        <th className="px-3 py-2 w-28" />
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.map((task, i) => (
                        <TaskRow
                          key={task.id}
                          task={task}
                          index={i}
                          isDone={task.status === "Done"}
                          language={language}
                          canEdit={canEdit}
                          canDelete={canDelete}
                          isDemo={isDemo}
                          onView={setViewingTask}
                          onEdit={openEdit}
                          onToggle={toggleTask}
                          onDelete={handleDelete}
                          onStatusChange={changeStatus}
                        />
                      ))}
                      {tasks.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-3 py-8 text-center text-xs text-gray-400 dark:text-gray-600">
                            {tr("Heç bir tapşırıq filtrlərə uyğun gəlmir.", "No tasks match your filters.")}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-800">
                  <DataPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={totalItems}
                    itemsPerPage={itemsPerPage}
                    showText={dataPaginationShowText(tr)}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {viewingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white truncate pr-4">
                {viewingTask.title}
              </h2>
              <button
                type="button"
                onClick={() => setViewingTask(null)}
                className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1 flex-shrink-0 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              {viewingTask.description && (
                <div className="flex gap-2.5">
                  <AlignLeft className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                    {viewingTask.description}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg px-3 py-2">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">
                    {tr("Prioritet", "Priority")}
                  </p>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${priorityBadge[viewingTask.priority]}`}
                  >
                    {priorityLabel[viewingTask.priority]}
                  </span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg px-3 py-2">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">
                    {tr("Status", "Status")}
                  </p>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${statusBadge[viewingTask.status]}`}
                  >
                    {statusLabel[viewingTask.status]}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg px-3 py-2">
                <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                    {tr("İcraçı", "Assignee")}
                  </p>
                  <p className="text-xs font-medium text-gray-800 dark:text-gray-200">
                    {viewingTask.assigneeName}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg px-3 py-2">
                <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                    {tr("Son tarix", "Due Date")}
                  </p>
                  <p className="text-xs font-medium text-gray-800 dark:text-gray-200">
                    {formatDate(viewingTask.dueDate)}
                  </p>
                </div>
              </div>
            </div>
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex gap-2">
              <button
                type="button"
                onClick={() => setViewingTask(null)}
                className="flex-1 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {tr("Bağla", "Close")}
              </button>
              {canEdit && !isDemo && (
                <button
                  type="button"
                  onClick={() => {
                    openEdit(viewingTask);
                    setViewingTask(null);
                  }}
                  className="flex-1 py-1.5 text-xs bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-lg font-medium transition-colors"
                >
                  {tr("Tapşırığı Redaktə Et", "Edit Task")}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                {editingTask
                  ? tr("Tapşırığı Redaktə Et", "Edit Task")
                  : tr("Tapşırıq Əlavə Et", "Add Task")}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <label className={lbl}>
                  {tr("Başlıq", "Title")} <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder={tr("Tapşırıq başlığı...", "Task title...")}
                  className={inp}
                />
              </div>
              <div>
                <label className={lbl}>{tr("Təsvir", "Description")}</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder={tr("Təsvir əlavə edin...", "Add a description...")}
                  rows={3}
                  className={`${inp} resize-none`}
                />
              </div>
              <div>
                <label className={lbl}>{tr("Prioritet", "Priority")}</label>
                <div className="flex gap-2">
                  {(["High", "Medium", "Low"] as Priority[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, priority: p }))}
                      className={`flex-1 py-1.5 text-xs rounded-lg font-medium border transition-all ${
                        form.priority === p
                          ? p === "High"
                            ? "bg-red-500 border-red-500 text-white shadow-sm"
                            : p === "Medium"
                              ? "bg-amber-500 border-amber-500 text-white shadow-sm"
                              : "bg-green-500 border-green-500 text-white shadow-sm"
                          : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300"
                      }`}
                    >
                      {priorityLabel[p]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={lbl}>{tr("Status", "Status")}</label>
                <FilterSelect
                  value={form.status}
                  onChange={(v) => setForm((f) => ({ ...f, status: v as Status }))}
                  options={columnOrder.map((s) => ({ value: s, label: statusLabel[s] }))}
                  className="w-full"
                />
              </div>
              <div>
                <label className={lbl}>{tr("İcraçı", "Assignee")}</label>
                <FilterSelect
                  value={form.assigneeUserId}
                  onChange={(v) => setForm((f) => ({ ...f, assigneeUserId: v }))}
                  options={
                    assignees.length > 0
                      ? assignees.map((e) => ({ value: e.id, label: e.name }))
                      : [{ value: "", label: tr("İcraçı yoxdur", "No assignees") }]
                  }
                  className="w-full"
                />
              </div>
              <div>
                <label className={lbl}>{tr("Son tarix", "Due Date")}</label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                  className={inp}
                />
              </div>
            </div>

            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex gap-2">
              {editingTask && canDelete && !isDemo && (
                <button
                  type="button"
                  onClick={() => {
                    void handleDelete(editingTask.id).then((ok) => {
                      if (ok) closeModal();
                    });
                  }}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title={tr("Tapşırığı sil", "Delete task")}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {tr("Ləğv Et", "Cancel")}
              </button>
              <button
                type="button"
                onClick={() => void saveTask()}
                disabled={!form.title.trim() || !form.assigneeUserId || saving}
                className="flex-1 py-1.5 text-xs bg-[#14b8a6] hover:bg-[#0d9488] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                {editingTask
                  ? tr("Dəyişiklikləri Saxla", "Save Changes")
                  : tr("Tapşırıq Yarat", "Create Task")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
