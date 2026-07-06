import axios, { AxiosError } from 'axios';
import { resolveApiBaseUrl } from './apiBaseUrl';
import type { TaskOverview, CreateTaskRequest, UpdateTaskRequest, TaskListResponse } from '../types/chat';

const API_BASE_URL = resolveApiBaseUrl();

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds
});

/**
 * Error response from API
 */
interface ApiErrorResponse {
  error: {
    message: string;
    code: string;
    details?: unknown;
  };
}

/**
 * Handle API errors
 */
function handleApiError(error: unknown): never {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    const errorData = axiosError.response?.data;

    if (errorData?.error) {
      throw new Error(`${errorData.error.code}: ${errorData.error.message}`);
    }

    if (axiosError.code === 'ECONNABORTED') {
      throw new Error('Request timeout');
    }

    throw new Error(axiosError.message || 'Network error');
  }

  throw new Error('Unknown error occurred');
}

/**
 * Retry a function with exponential backoff
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on client errors (4xx)
      if (axios.isAxiosError(error) && error.response?.status && error.response.status < 500) {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, attempt)));
      }
    }
  }

  throw lastError;
}

/**
 * Task Management API Client
 * Chat UI Redesign
 */
export const taskApi = {
  /**
   * Get tasks for a session
   *
   * @param sessionId - ID of the chat session
   * @param options - Query options (limit, offset, status)
   * @returns Task list with pagination info
   */
  getTasks: async (
    sessionId: string,
    options?: {
      limit?: number;
      offset?: number;
      status?: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
    }
  ): Promise<TaskListResponse> => {
    try {
      return await withRetry(async () => {
        const params = new URLSearchParams();
        if (options?.limit) params.append('limit', options.limit.toString());
        if (options?.offset) params.append('offset', options.offset.toString());
        if (options?.status) params.append('status', options.status);

        const queryString = params.toString();
        const url = `/tasks/${sessionId}${queryString ? `?${queryString}` : ''}`;

        const response = await client.get<TaskListResponse>(url);
        return response.data;
      });
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Create a new task
   *
   * @param taskData - Task creation data
   * @returns Created task
   */
  createTask: async (taskData: CreateTaskRequest): Promise<TaskOverview> => {
    try {
      const response = await client.post<TaskOverview>('/tasks', taskData);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Update a task
   *
   * @param taskId - ID of the task to update
   * @param updates - Partial updates
   * @returns Updated task
   */
  updateTask: async (taskId: string, updates: UpdateTaskRequest): Promise<TaskOverview> => {
    try {
      const response = await client.patch<TaskOverview>(`/tasks/${taskId}`, updates);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Delete a task (optional)
   *
   * @param taskId - ID of the task to delete
   */
  deleteTask: async (taskId: string): Promise<void> => {
    try {
      await client.delete(`/tasks/${taskId}`);
    } catch (error) {
      return handleApiError(error);
    }
  },
};

// 命名导出（便于解构导入）
export const getTasks = taskApi.getTasks;
export const createTask = taskApi.createTask;
export const updateTask = taskApi.updateTask;
export const deleteTask = taskApi.deleteTask;
