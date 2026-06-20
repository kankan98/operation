/**
 * 任务管理 Hook
 * 封装任务的创建、更新、查询逻辑
 */

import { useState, useEffect, useCallback } from 'react';
import { TaskOverview, TaskStatus, UpdateTaskRequest } from '@/types/chat';
import { taskApi } from '@/services/taskApi';
import { useChatStore } from '@/stores/chatStore';

export interface UseTaskManagementOptions {
  sessionId: string | null;
  autoLoad?: boolean;
}

export interface UseTaskManagementReturn {
  tasks: TaskOverview[];
  loading: boolean;
  error: string | null;
  refreshTasks: () => Promise<void>;
  createNewTask: (task: Omit<TaskOverview, 'id' | 'createdAt'>) => Promise<void>;
  updateTaskStatus: (taskId: string, status: TaskStatus, metadata?: Record<string, unknown>) => Promise<void>;
  cancelTask: (taskId: string) => Promise<void>;
  getTaskById: (taskId: string) => TaskOverview | undefined;
  getTasksByStatus: (status: TaskStatus) => TaskOverview[];
}

/**
 * 任务管理 Hook
 */
export function useTaskManagement(
  options: UseTaskManagementOptions
): UseTaskManagementReturn {
  const { sessionId, autoLoad = true } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 从 store 获取任务列表
  const tasks = useChatStore((state) => state.taskOverviews);
  const setTaskOverviews = useChatStore((state) => state.setTaskOverviews);
  const addTask = useChatStore((state) => state.addTask);
  const updateTaskInStore = useChatStore((state) => state.updateTask);

  /**
   * 刷新任务列表
   */
  const refreshTasks = useCallback(async () => {
    if (!sessionId) {
      setTaskOverviews([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await taskApi.getTasks(sessionId);
      setTaskOverviews(data.tasks || data);
    } catch (err) {
      const message = err instanceof Error ? err.message : '获取任务列表失败';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [sessionId, setTaskOverviews]);

  /**
   * 创建新任务
   */
  const createNewTask = useCallback(
    async (task: Omit<TaskOverview, 'id' | 'createdAt'>) => {
      if (!sessionId) {
        throw new Error('No active session');
      }

      setError(null);

      try {
        const newTask = await taskApi.createTask({
          sessionId,
          taskName: task.taskName,
          status: task.status,
          relatedProducts: task.relatedProducts,
          platform: task.platform,
          metadata: task.metadata,
        });
        addTask(newTask);
      } catch (err) {
        const message = err instanceof Error ? err.message : '创建任务失败';
        setError(message);
        throw err;
      }
    },
    [sessionId, addTask]
  );

  /**
   * 更新任务状态
   */
  const updateTaskStatus = useCallback(
    async (taskId: string, status: TaskStatus, metadata?: Record<string, unknown>) => {
      setError(null);

      try {
        const updates: UpdateTaskRequest = {
          status,
          ...metadata,
        };

        // 如果状态为完成或失败，设置结束时间
        if (status === 'completed' || status === 'failed') {
          updates.endTime = Date.now();
        }

        const updatedTask = await taskApi.updateTask(taskId, updates);
        updateTaskInStore(taskId, updatedTask);
      } catch (err) {
        const message = err instanceof Error ? err.message : '更新任务状态失败';
        setError(message);
        throw err;
      }
    },
    [updateTaskInStore]
  );

  /**
   * 取消任务
   */
  const cancelTask = useCallback(
    async (taskId: string) => {
      await updateTaskStatus(taskId, 'failed', {
        endTime: new Date().toISOString(),
        metadata: { cancelled: true },
      });
    },
    [updateTaskStatus]
  );

  /**
   * 根据ID获取任务
   */
  const getTaskById = useCallback(
    (taskId: string): TaskOverview | undefined => {
      return tasks.find((task) => task.id === taskId);
    },
    [tasks]
  );

  /**
   * 根据状态获取任务列表
   */
  const getTasksByStatus = useCallback(
    (status: TaskStatus): TaskOverview[] => {
      return tasks.filter((task) => task.status === status);
    },
    [tasks]
  );

  // 自动加载任务列表
  useEffect(() => {
    if (autoLoad && sessionId) {
      queueMicrotask(() => {
        void refreshTasks();
      });
    }
  }, [sessionId, autoLoad, refreshTasks]);

  return {
    tasks,
    loading,
    error,
    refreshTasks,
    createNewTask,
    updateTaskStatus,
    cancelTask,
    getTaskById,
    getTasksByStatus,
  };
}
