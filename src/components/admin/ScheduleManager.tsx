import { useState, useEffect } from "react";
import { API_BASE } from "../../lib/apiBase";

type Schedule = {
  id: number;
  name: string;
  frequency: 'daily' | 'weekly';
  time: string;
  timezone: string;
  days_of_week: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (EST/EDT)' },
  { value: 'America/Chicago', label: 'Central Time (CST/CDT)' },
  { value: 'America/Denver', label: 'Mountain Time (MST/MDT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PST/PDT)' },
  { value: 'America/Phoenix', label: 'Arizona Time (MST)' },
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
];

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

export default function ScheduleManager() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    frequency: "weekly" as 'daily' | 'weekly',
    time: "17:00",
    timezone: "America/New_York",
    days_of_week: [] as number[],
    active: true,
  });

  useEffect(() => {
    loadSchedules();
  }, []);

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError("");
        setSuccess("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/schedules/list.php`, {
        credentials: 'same-origin',
      });
      if (!response.ok) throw new Error('Failed to load schedules');
      const data = await response.json();
      setSchedules(data.schedules || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load schedules');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const payload = {
        ...formData,
        days_of_week: formData.frequency === 'weekly'
          ? formData.days_of_week.sort((a, b) => a - b).join(',')
          : null,
      };

      const url = editingSchedule
        ? `${API_BASE}/schedules/update.php`
        : `${API_BASE}/schedules/create.php`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(editingSchedule ? { ...payload, id: editingSchedule.id } : payload),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Failed to save schedule');
      }

      setSuccess(editingSchedule ? 'Schedule updated!' : 'Schedule created!');
      setShowForm(false);
      setEditingSchedule(null);
      resetForm();
      await loadSchedules();
    } catch (err: any) {
      setError(err.message || 'Failed to save schedule');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      frequency: "weekly",
      time: "17:00",
      timezone: "America/New_York",
      days_of_week: [],
      active: true,
    });
  };

  const startEdit = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      name: schedule.name,
      frequency: schedule.frequency,
      time: schedule.time,
      timezone: schedule.timezone,
      days_of_week: schedule.days_of_week
        ? schedule.days_of_week.split(',').map(d => parseInt(d))
        : [],
      active: schedule.active,
    });
    setShowForm(true);
  };

  const toggleDayOfWeek = (day: number) => {
    setFormData(prev => ({
      ...prev,
      days_of_week: prev.days_of_week.includes(day)
        ? prev.days_of_week.filter(d => d !== day)
        : [...prev.days_of_week, day]
    }));
  };

  const formatDaysOfWeek = (daysStr: string | null) => {
    if (!daysStr) return 'Every day';
    const days = daysStr.split(',').map(d => parseInt(d));
    return days.map(d => DAYS_OF_WEEK[d].label.slice(0, 3)).join(', ');
  };

  const deleteSchedule = async (id: number) => {
    if (!confirm('Delete this schedule? Stories using it will have no schedule.')) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/schedules/delete.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ id }),
      });

      if (!response.ok) throw new Error('Failed to delete schedule');

      setSuccess('Schedule deleted!');
      await loadSchedules();
    } catch (err: any) {
      setError(err.message || 'Failed to delete schedule');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Publishing Schedules
        </h1>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingSchedule(null);
            resetForm();
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create Schedule
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg dark:bg-red-900 dark:text-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg dark:bg-green-900 dark:text-green-200">
          {success}
        </div>
      )}

      {/* Schedule Form */}
      {showForm && (
        <div className="mb-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            {editingSchedule ? 'Edit Schedule' : 'Create Schedule'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Schedule Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Daily at 5pm EST"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Frequency
                </label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    frequency: e.target.value as 'daily' | 'weekly',
                    days_of_week: e.target.value === 'daily' ? [] : prev.days_of_week
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly (specific days)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Time
                </label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Timezone
              </label>
              <select
                value={formData.timezone}
                onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                {TIMEZONES.map(tz => (
                  <option key={tz.value} value={tz.value}>{tz.label}</option>
                ))}
              </select>
            </div>

            {formData.frequency === 'weekly' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Days of Week
                </label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map(day => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDayOfWeek(day.value)}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        formData.days_of_week.includes(day.value)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
                {formData.days_of_week.length === 0 && (
                  <p className="text-sm text-red-600 mt-1">Select at least one day</p>
                )}
              </div>
            )}

            <div className="flex items-center">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="active" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Active (schedule will be available for use)
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading || (formData.frequency === 'weekly' && formData.days_of_week.length === 0)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : (editingSchedule ? 'Update' : 'Create')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingSchedule(null);
                  resetForm();
                }}
                className="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Schedules List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {loading && schedules.length === 0 ? (
          <p className="p-4 text-gray-600 dark:text-gray-400">Loading schedules...</p>
        ) : schedules.length === 0 ? (
          <p className="p-4 text-gray-600 dark:text-gray-400">
            No schedules yet. Create one to get started!
          </p>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {schedules.map((schedule) => (
              <div key={schedule.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {schedule.name}
                      </h3>
                      <span className={`px-2 py-1 rounded text-xs ${
                        schedule.active
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {schedule.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <p>
                        <span className="font-medium">Frequency:</span>{' '}
                        {schedule.frequency === 'daily' ? 'Daily' : `Weekly - ${formatDaysOfWeek(schedule.days_of_week)}`}
                      </p>
                      <p>
                        <span className="font-medium">Time:</span> {schedule.time}
                      </p>
                      <p>
                        <span className="font-medium">Timezone:</span> {schedule.timezone}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(schedule)}
                      className="bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 transition-colors dark:bg-blue-900 dark:text-blue-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteSchedule(schedule.id)}
                      className="bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 transition-colors dark:bg-red-900 dark:text-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
