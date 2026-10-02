import { useEffect, useState } from "react";

import { API_BASE_URL } from "../../config/api";
import { useAuth } from "../../context/useAuth";
import "../css_files/LearningPaths.css";

const WEEKDAYS = [
  ["Sun", 0],
  ["Mon", 1],
  ["Tue", 2],
  ["Wed", 3],
  ["Thu", 4],
  ["Fri", 5],
  ["Sat", 6],
];

function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(dateString, amount) {
  const date = new Date(`${dateString}T12:00:00`);
  date.setDate(date.getDate() + amount);
  return localDateString(date);
}

function weekKey(dateString) {
  const date = new Date(`${dateString}T12:00:00`);
  const day = date.getDay();
  date.setDate(date.getDate() - ((day + 6) % 7));
  return localDateString(date);
}

function getHabitSummary(goal) {
  const habit = goal.habit || {};
  const period = habit.period || "day";
  const target = Number(habit.targetValue || 1);
  const totals = new Map();

  for (const entry of goal.entries || []) {
    const key = period === "week" ? weekKey(entry.localDate) : entry.localDate;
    totals.set(key, (totals.get(key) || 0) + Number(entry.value || 0));
  }

  const today = localDateString();
  const currentKey = period === "week" ? weekKey(today) : today;
  const currentTotal = totals.get(currentKey) || 0;

  let streak = 0;
  let cursor = currentKey;

  // A still-in-progress period does not break a streak before it ends.
  if (currentTotal < target) {
    cursor = period === "week" ? addDays(cursor, -7) : addDays(cursor, -1);
    if (period === "week") {
      cursor = weekKey(cursor);
    }
  }

  for (let index = 0; index < 3650; index += 1) {
    if (
      period === "day" &&
      habit.daysOfWeek?.length > 0 &&
      !habit.daysOfWeek.includes(new Date(`${cursor}T12:00:00`).getDay())
    ) {
      cursor = addDays(cursor, -1);
      continue;
    }

    if ((totals.get(cursor) || 0) < target) {
      break;
    }

    streak += 1;
    cursor = period === "week" ? addDays(cursor, -7) : addDays(cursor, -1);
    if (period === "week") {
      cursor = weekKey(cursor);
    }
  }

  return {
    currentTotal,
    target,
    unit: habit.unit || "times",
    streak,
    streakUnit: period === "week" ? "week" : "day",
    periodLabel: period === "week" ? "This week" : "Today",
  };
}

function getTargetSummary(goal) {
  const target = goal.target || {};
  const period = target.period || "total";
  const today = localDateString();

  const relevantEntries = (goal.entries || []).filter((entry) => {
    if (period === "total") return true;
    if (period === "day") return entry.localDate === today;
    if (period === "week") return weekKey(entry.localDate) === weekKey(today);
    return entry.localDate?.slice(0, 7) === today.slice(0, 7);
  });

  const current = relevantEntries.reduce(
    (sum, entry) => sum + Number(entry.value || 0),
    0,
  );

  return {
    current,
    target: Number(target.targetValue || 0),
    unit: target.unit || "",
    period,
  };
}

function GoalForm({ initialGoal, busy, onCancel, onSave }) {
  const [title, setTitle] = useState(initialGoal?.title || "");
  const [description, setDescription] = useState(
    initialGoal?.description || "",
  );
  const [trackingType, setTrackingType] = useState(
    initialGoal?.trackingType || "milestones",
  );
  const trackingDescriptions = {
  milestones:
    "Break this goal into sub-goals, topics, and tasks. Progress comes from completing them.",
  habit:
    "Track something you repeat. Set a daily or weekly target and log each check-in.",
  target:
    "Track a number toward a target, such as distance, time, or pages.",
};

const statusDescriptions = {
  active: "You’re currently working on this goal.",
  paused: "Keep this goal and its progress for when you’re ready to return.",
  completed: "You’ve finished this goal.",
};
  const [status, setStatus] = useState(initialGoal?.status || "active");
  const [targetDate, setTargetDate] = useState(
    initialGoal?.targetDate ? initialGoal.targetDate.slice(0, 10) : "",
  );

  const [habitPeriod, setHabitPeriod] = useState(
    initialGoal?.habit?.period || "day",
  );
  const [habitTarget, setHabitTarget] = useState(
    initialGoal?.habit?.targetValue || 1,
  );
  const [habitUnit, setHabitUnit] = useState(
    initialGoal?.habit?.unit || "times",
  );
  const [daysOfWeek, setDaysOfWeek] = useState(
    initialGoal?.habit?.daysOfWeek || [],
  );

  const [targetValue, setTargetValue] = useState(
    initialGoal?.target?.targetValue || "",
  );
  const [targetUnit, setTargetUnit] = useState(
    initialGoal?.target?.unit || "",
  );
  const [targetPeriod, setTargetPeriod] = useState(
    initialGoal?.target?.period || "total",
  );

  function toggleWeekday(day) {
    setDaysOfWeek((current) =>
      current.includes(day)
        ? current.filter((value) => value !== day)
        : [...current, day],
    );
  }

  function handleSubmit(event) {
    event.preventDefault();

    const values = {
      title: title.trim(),
      description: description.trim(),
      trackingType,
      status,
      targetDate: targetDate || null,
    };

    if (trackingType === "habit") {
      values.habit = {
        period: habitPeriod,
        targetValue: Number(habitTarget),
        unit: habitUnit.trim() || "times",
        daysOfWeek: habitPeriod === "day" ? daysOfWeek : [],
      };
    }

    if (trackingType === "target") {
      values.target = {
        targetValue: Number(targetValue),
        unit: targetUnit.trim(),
        period: targetPeriod,
      };
    }

    onSave(values);
  }

  return (
    <form className="goal-form" onSubmit={handleSubmit}>
      <label>
        Name
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={150}
          required
          autoFocus
        />
      </label>

      <label>
        Description <span>(optional)</span>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={1000}
          rows={2}
        />
      </label>

      <div className="goal-form-grid">
  <label>
    Track as
    <select
      value={trackingType}
      onChange={(event) => setTrackingType(event.target.value)}
    >
      <option value="milestones">Milestones</option>
      <option value="habit">Habit</option>
      <option value="target">Number toward a target</option>
    </select>
    <small className="goal-field-help" aria-live="polite">
      {trackingDescriptions[trackingType]}
    </small>
  </label>

  <label>
    Status
    <select
      value={status}
      onChange={(event) => setStatus(event.target.value)}
    >
      <option value="active">Active</option>
      <option value="paused">Paused</option>
      <option value="completed">Completed</option>
    </select>
    <small className="goal-field-help" aria-live="polite">
      {statusDescriptions[status]}
    </small>
  </label>
</div>

      {trackingType === "habit" && (
        <fieldset className="goal-form-extra">
          <legend>Habit target</legend>

          <div className="goal-form-grid">
            <label>
              Repeat
              <select
                value={habitPeriod}
                onChange={(event) => setHabitPeriod(event.target.value)}
              >
                <option value="day">Daily</option>
                <option value="week">Weekly</option>
              </select>
            </label>

            <label>
              Target per {habitPeriod === "week" ? "week" : "day"}
              <input
                type="number"
                min="0.01"
                step="any"
                value={habitTarget}
                onChange={(event) => setHabitTarget(event.target.value)}
                required
              />
            </label>

            <label>
              Unit
              <input
                value={habitUnit}
                onChange={(event) => setHabitUnit(event.target.value)}
                placeholder="times, minutes, km…"
                maxLength={30}
              />
            </label>
          </div>

          {habitPeriod === "day" && (
            <div className="goal-weekdays">
              <span>Scheduled days (optional)</span>
              <div>
                {WEEKDAYS.map(([label, day]) => (
                  <label key={day}>
                    <input
                      type="checkbox"
                      checked={daysOfWeek.includes(day)}
                      onChange={() => toggleWeekday(day)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          )}
        </fieldset>
      )}

      {trackingType === "target" && (
        <fieldset className="goal-form-extra">
          <legend>Target</legend>

          <div className="goal-form-grid">
            <label>
              Amount
              <input
                type="number"
                min="0.01"
                step="any"
                value={targetValue}
                onChange={(event) => setTargetValue(event.target.value)}
                required
              />
            </label>

            <label>
              Unit
              <input
                value={targetUnit}
                onChange={(event) => setTargetUnit(event.target.value)}
                placeholder="km, pages, hours…"
                maxLength={30}
                required
              />
            </label>

            <label>
              Period
              <select
                value={targetPeriod}
                onChange={(event) => setTargetPeriod(event.target.value)}
              >
                <option value="total">Overall</option>
                <option value="day">Daily</option>
                <option value="week">Weekly</option>
                <option value="month">Monthly</option>
              </select>
            </label>
          </div>
        </fieldset>
      )}

      <label>
        Target date <span>(optional)</span>
        <input
          type="date"
          value={targetDate}
          onChange={(event) => setTargetDate(event.target.value)}
        />
      </label>

      <div className="goal-form-actions">
        <button type="submit" disabled={busy}>
          {busy ? "Saving…" : initialGoal ? "Save changes" : "Create"}
        </button>
        <button type="button" className="quiet-button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function EntryForm({ goal, initialEntry, busy, onCancel, onSave }) {
  const [value, setValue] = useState(initialEntry?.value ?? 1);
  const [note, setNote] = useState(initialEntry?.note || "");
  const [localDate, setLocalDate] = useState(
    initialEntry?.localDate || localDateString(),
  );

  function handleSubmit(event) {
    event.preventDefault();
    onSave({
      value: Number(value),
      note: note.trim(),
      localDate,
      occurredAt: initialEntry?.occurredAt || new Date().toISOString(),
    });
  }

  const unit =
    goal.trackingType === "habit"
      ? goal.habit?.unit || "times"
      : goal.target?.unit || "";

  return (
    <form className="entry-form" onSubmit={handleSubmit}>
      <label>
        Amount {unit && `(${unit})`}
        <input
          type="number"
          min="0.01"
          step="any"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          required
        />
      </label>
      <label>
        Date
        <input
          type="date"
          value={localDate}
          onChange={(event) => setLocalDate(event.target.value)}
          required
        />
      </label>
      <label>
        Note <span>(optional)</span>
        <input
          value={note}
          onChange={(event) => setNote(event.target.value)}
          maxLength={500}
        />
      </label>
      <div className="goal-form-actions">
        <button type="submit" disabled={busy}>
          {busy ? "Saving…" : initialEntry ? "Save entry" : "Log progress"}
        </button>
        <button type="button" className="quiet-button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function GoalEntryRow({ goal, entry, busy, onEdit, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <EntryForm
        goal={goal}
        initialEntry={entry}
        busy={busy}
        onCancel={() => setIsEditing(false)}
        onSave={async (values) => {
          const saved = await onEdit(values);
          if (saved) setIsEditing(false);
        }}
      />
    );
  }

  return (
    <li className="goal-entry">
      <div>
        <strong>
          {entry.value} {goal.trackingType === "habit"
            ? goal.habit?.unit || "times"
            : goal.target?.unit || ""}
        </strong>
        <span>{entry.localDate}</span>
        {entry.note && <p>{entry.note}</p>}
      </div>
      <div className="goal-entry-actions">
        <button type="button" className="text-button" onClick={() => setIsEditing(true)}>
          Edit
        </button>
        <button
          type="button"
          className="text-button delete-text"
          disabled={busy}
          onClick={onDelete}
        >
          Delete
        </button>
      </div>
    </li>
  );
}

function countMilestones(goal) {
  const children = goal.children || [];

  if (children.length) {
    return children.reduce(
      (total, child) => {
        const count = countMilestones(child);
        return {
          done: total.done + count.done,
          all: total.all + count.all,
        };
      },
      { done: 0, all: 0 },
    );
  }

  if (goal.trackingType !== "milestones") {
    return { done: 0, all: 0 };
  }

  return { done: goal.completed ? 1 : 0, all: 1 };
}

function GoalNode({
  goal,
  depth,
  busyAction,
  onCreateSubgoal,
  onUpdateGoal,
  onDeleteGoal,
  onToggleMilestone,
  onCreateEntry,
  onUpdateEntry,
  onDeleteEntry,
}) {
  const [isExpanded, setIsExpanded] = useState(depth === 0);
  const [showEdit, setShowEdit] = useState(false);
  const [showChildForm, setShowChildForm] = useState(false);
  const [showEntryForm, setShowEntryForm] = useState(false);

  const children = goal.children || [];
  const isBusy = Boolean(busyAction);
  const typeLabel = {
    milestones: "Milestones",
    habit: "Habit",
    target: "Target",
  }[goal.trackingType];

  const milestones = countMilestones(goal);
  const habitSummary =
    goal.trackingType === "habit" ? getHabitSummary(goal) : null;
  const targetSummary =
    goal.trackingType === "target" ? getTargetSummary(goal) : null;

  const targetProgress = targetSummary?.target
    ? Math.min(
        100,
        Math.round((targetSummary.current / targetSummary.target) * 100),
      )
    : 0;

  function confirmDelete() {
    const message = children.length
      ? `Delete "${goal.title}" and all of its sub-goals?`
      : `Delete "${goal.title}"?`;

    if (window.confirm(message)) {
      onDeleteGoal(goal);
    }
  }

  return (
    <article
      className={`goal-node goal-node-${goal.trackingType}`}
      style={{ "--goal-depth": Math.min(depth, 5) }}
    >
      <div className="goal-node-heading">
        <div className="goal-node-title-wrap">
          {children.length > 0 && (
            <button
              type="button"
              className="expand-button"
              aria-label={isExpanded ? "Collapse sub-goals" : "Expand sub-goals"}
              onClick={() => setIsExpanded((expanded) => !expanded)}
            >
              {isExpanded ? "−" : "+"}
            </button>
          )}

          {goal.trackingType === "milestones" && children.length === 0 ? (
            <input
              className="milestone-check"
              type="checkbox"
              checked={Boolean(goal.completed)}
              disabled={isBusy}
              aria-label={`Mark ${goal.title} complete`}
              onChange={() => onToggleMilestone(goal)}
            />
          ) : (
            <span className={`goal-type-dot dot-${goal.trackingType}`} />
          )}

          <div>
            <h3 className={goal.status === "completed" ? "goal-done" : ""}>
              {goal.title}
            </h3>
            {goal.description && (
              <p className="goal-node-description">{goal.description}</p>
            )}
          </div>
        </div>

        <span className={`goal-type goal-type-${goal.trackingType}`}>
          {typeLabel}
        </span>
      </div>

      <div className="goal-node-summary">
        {goal.trackingType === "milestones" && children.length === 0 && (
          <span>{goal.completed ? "Completed" : "Not complete"}</span>
        )}

        {children.length > 0 && milestones.all > 0 && (
          <span>
            {milestones.done} of {milestones.all} milestones complete
          </span>
        )}

        {goal.trackingType === "habit" && habitSummary && (
          <>
            <span>
              {habitSummary.periodLabel}: {habitSummary.currentTotal} /{" "}
              {habitSummary.target} {habitSummary.unit}
            </span>
            <span>
              {habitSummary.streak} {habitSummary.streakUnit} streak
            </span>
          </>
        )}

        {goal.trackingType === "target" && targetSummary && (
          <span>
            {targetSummary.current} / {targetSummary.target}{" "}
            {targetSummary.unit}
            {targetSummary.period !== "total" && ` this ${targetSummary.period}`}
          </span>
        )}

        {goal.targetDate && (
          <span>Due {new Date(goal.targetDate).toLocaleDateString()}</span>
        )}
        {goal.status === "paused" && <span>Paused</span>}
      </div>

      {goal.trackingType === "target" && targetSummary?.target > 0 && (
        <div
          className="goal-target-track"
          role="progressbar"
          aria-label={`Progress for ${goal.title}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={targetProgress}
        >
          <span style={{ width: `${targetProgress}%` }} />
        </div>
      )}

      <div className="goal-node-actions">
        <button
          type="button"
          className="text-button"
          disabled={isBusy}
          onClick={() => setShowChildForm((show) => !show)}
        >
          + Add sub-goal
        </button>

        {(goal.trackingType === "habit" || goal.trackingType === "target") && (
          <button
            type="button"
            className="text-button"
            disabled={isBusy}
            onClick={() => setShowEntryForm((show) => !show)}
          >
            + Log progress
          </button>
        )}

        <button
          type="button"
          className="text-button"
          disabled={isBusy}
          onClick={() => setShowEdit((show) => !show)}
        >
          Edit
        </button>

        <button
          type="button"
          className="text-button delete-text"
          disabled={isBusy}
          onClick={confirmDelete}
        >
          Delete
        </button>
      </div>

      {showEdit && (
        <GoalForm
          initialGoal={goal}
          busy={isBusy}
          onCancel={() => setShowEdit(false)}
          onSave={async (values) => {
            const saved = await onUpdateGoal(goal, values);
            if (saved) setShowEdit(false);
          }}
        />
      )}

      {showChildForm && (
        <GoalForm
          busy={isBusy}
          onCancel={() => setShowChildForm(false)}
          onSave={async (values) => {
            const saved = await onCreateSubgoal(goal, values);
            if (saved) setShowChildForm(false);
          }}
        />
      )}

      {showEntryForm && (
        <EntryForm
          goal={goal}
          busy={isBusy}
          onCancel={() => setShowEntryForm(false)}
          onSave={async (values) => {
            const saved = await onCreateEntry(goal, values);
            if (saved) setShowEntryForm(false);
          }}
        />
      )}

      {(goal.entries || []).length > 0 && (
        <details className="goal-history">
          <summary>Progress history ({goal.entries.length})</summary>
          <ul>
            {goal.entries.map((entry) => (
              <GoalEntryRow
                key={entry._id}
                goal={goal}
                entry={entry}
                busy={isBusy}
                onEdit={(values) => onUpdateEntry(goal, entry, values)}
                onDelete={() => onDeleteEntry(goal, entry)}
              />
            ))}
          </ul>
        </details>
      )}

      {isExpanded && children.length > 0 && (
        <div className="goal-children">
          {children.map((child) => (
            <GoalNode
              key={child._id}
              goal={child}
              depth={depth + 1}
              busyAction={busyAction}
              onCreateSubgoal={onCreateSubgoal}
              onUpdateGoal={onUpdateGoal}
              onDeleteGoal={onDeleteGoal}
              onToggleMilestone={onToggleMilestone}
              onCreateEntry={onCreateEntry}
              onUpdateEntry={onUpdateEntry}
              onDeleteEntry={onDeleteEntry}
            />
          ))}
        </div>
      )}
    </article>
  );
}

function LearningPaths() {
  const { token } = useAuth();
  const [goals, setGoals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [busyAction, setBusyAction] = useState("");
  const [error, setError] = useState("");

  async function request(path, options = {}) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Something went wrong.");
    }

    return data;
  }

  async function refreshGoals() {
    const data = await request("/goals");
    setGoals(data.goals || []);
  }

  useEffect(() => {
    let isCurrent = true;

    async function loadGoals() {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`${API_BASE_URL}/goals`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Could not load your goals.");
        }

        if (isCurrent) {
          setGoals(data.goals || []);
        }
      } catch (loadError) {
        if (isCurrent) {
          setError(loadError.message || "Could not load your goals.");
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    }

    if (token) {
  loadGoals();
}

    return () => {
      isCurrent = false;
    };
  }, [token]);

  async function runMutation(key, path, options = {}) {
    setBusyAction(key);
    setError("");

    try {
      await request(path, options);
      await refreshGoals();
      return true;
    } catch (mutationError) {
      setError(mutationError.message || "Could not save that change.");
      return false;
    } finally {
      setBusyAction("");
    }
  }

  function jsonOptions(method, body) {
    return {
      method,
      body: JSON.stringify(body),
    };
  }

  function createGoal(values) {
    return runMutation("create", "/goals", jsonOptions("POST", values));
  }

  function createSubgoal(parent, values) {
    return runMutation(
      `subgoal-${parent._id}`,
      `/goals/${parent._id}/subgoals`,
      jsonOptions("POST", values),
    );
  }

  function updateGoal(goal, values) {
    return runMutation(
      `goal-${goal._id}`,
      `/goals/${goal._id}`,
      jsonOptions("PATCH", values),
    );
  }

  function deleteGoal(goal) {
    return runMutation(`goal-${goal._id}`, `/goals/${goal._id}`, {
      method: "DELETE",
    });
  }

  function toggleMilestone(goal) {
    return runMutation(
      `goal-${goal._id}`,
      `/goals/${goal._id}`,
      jsonOptions("PATCH", { completed: !goal.completed }),
    );
  }

  function createEntry(goal, values) {
    return runMutation(
      `goal-${goal._id}`,
      `/goals/${goal._id}/entries`,
      jsonOptions("POST", values),
    );
  }

  function updateEntry(goal, entry, values) {
    return runMutation(
      `goal-${goal._id}`,
      `/goals/${goal._id}/entries/${entry._id}`,
      jsonOptions("PATCH", values),
    );
  }

  function deleteEntry(goal, entry) {
    if (!window.confirm("Delete this progress entry?")) {
      return Promise.resolve(false);
    }

    return runMutation(
      `goal-${goal._id}`,
      `/goals/${goal._id}/entries/${entry._id}`,
      { method: "DELETE" },
    );
  }

  return (
    <main className="goals-page">
      <header className="goals-header">
        <div>
          <p className="goals-eyebrow">YOUR PROGRESS, YOUR WAY</p>
          <h1>Track Your Goals</h1>
          <p>Choose what matters to you and track it in a way that fits.</p>
        </div>

        <button
          type="button"
          className="primary-action"
          onClick={() => setShowCreate((show) => !show)}
        >
          {showCreate ? "Close" : "+ New goal"}
        </button>
      </header>

      {showCreate && (
        <section className="goal-create-panel" aria-label="Create a goal">
          <GoalForm
            busy={busyAction === "create"}
            onCancel={() => setShowCreate(false)}
            onSave={async (values) => {
              const saved = await createGoal(values);
              if (saved) setShowCreate(false);
            }}
          />
        </section>
      )}

      {error && (
        <p className="goals-error" role="alert">
          {error}
        </p>
      )}

      <section className="goals-list" aria-label="Your goals">
        {isLoading ? (
          <p className="goals-empty" role="status">
            Loading your goals…
          </p>
        ) : goals.length === 0 ? (
          <div className="goals-empty">
            <h2>Nothing to track yet</h2>
            <p>Create a goal that matters to you, then add sub-goals or log progress.</p>
            <button
              type="button"
              className="text-button"
              onClick={() => setShowCreate(true)}
            >
              Create your first goal
            </button>
          </div>
        ) : (
          goals.map((goal) => (
            <GoalNode
              key={goal._id}
              goal={goal}
              depth={0}
              busyAction={busyAction}
              onCreateSubgoal={createSubgoal}
              onUpdateGoal={updateGoal}
              onDeleteGoal={(item) => {
                const message = `Delete "${item.title}" and all its sub-goals and progress entries?`;
                if (window.confirm(message)) deleteGoal(item);
              }}
              onToggleMilestone={toggleMilestone}
              onCreateEntry={createEntry}
              onUpdateEntry={updateEntry}
              onDeleteEntry={deleteEntry}
            />
          ))
        )}
      </section>
    </main>
  );
}

export default LearningPaths;