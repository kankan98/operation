"use strict";
/**
 * SSE 流式协议类型定义
 *
 * 版本：2.0.0
 *
 * 设计原则：
 * 1. 所有事件类型使用统一后缀 (_start, _change, _delta, _complete, _occurred)
 * 2. 所有时间戳使用毫秒级 Unix timestamp
 * 3. 所有 ID 由后端生成（messageId, sessionId, streamId, toolId）
 * 4. 工具参数不流式传输，一次性发送完整参数
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamErrorCode = void 0;
// ============================================================
//                      错误码定义
// ============================================================
/**
 * 标准错误码
 */
var StreamErrorCode;
(function (StreamErrorCode) {
    // 客户端错误 (4xx)
    StreamErrorCode["INVALID_REQUEST"] = "INVALID_REQUEST";
    StreamErrorCode["SESSION_NOT_FOUND"] = "SESSION_NOT_FOUND";
    StreamErrorCode["STREAM_NOT_FOUND"] = "STREAM_NOT_FOUND";
    StreamErrorCode["STREAM_EXPIRED"] = "STREAM_EXPIRED";
    // 服务端错误 (5xx)
    StreamErrorCode["INTERNAL_ERROR"] = "INTERNAL_ERROR";
    StreamErrorCode["AI_PROVIDER_ERROR"] = "AI_PROVIDER_ERROR";
    StreamErrorCode["TOOL_EXECUTION_ERROR"] = "TOOL_EXECUTION_ERROR";
    // 限流错误
    StreamErrorCode["RATE_LIMIT_EXCEEDED"] = "RATE_LIMIT_EXCEEDED";
    // 超时错误
    StreamErrorCode["STREAM_TIMEOUT"] = "STREAM_TIMEOUT";
})(StreamErrorCode || (exports.StreamErrorCode = StreamErrorCode = {}));
