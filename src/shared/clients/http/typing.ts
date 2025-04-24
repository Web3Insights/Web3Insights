import type { DataValue, RequestConfig, ResponseResult, ResponseInterceptor } from "../../types";

type HttpClientInitializer = {
  baseUrl?: string;
  headers?: RequestConfig["headers"];
  normalizer?: (res: Response) => Promise<ResponseResult>;
};

interface IHttpClient {
  get: (url: string, config?: RequestConfig) => Promise<ResponseResult>;
  post: (url: string, data?: Record<string, DataValue>, config?: RequestConfig) => Promise<ResponseResult>;
  put: (url: string, data?: Record<string, DataValue>, config?: RequestConfig) => Promise<ResponseResult>;
  use: (interceptor: ResponseInterceptor) => void;
}

export type { HttpClientInitializer, IHttpClient };
