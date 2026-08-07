import type { Response } from "express";
import type { Paginated } from "@portsume/shared";

export const ok = <T>(res: Response, data: T, status = 200): void => {
  res.status(status).json({ ok: true, data });
};

export const okPaginated = <T>(
  res: Response,
  items: T[],
  page: number,
  pageSize: number,
  total: number,
): void => {
  const payload: Paginated<T> = {
    items,
    page,
    pageSize,
    total,
    hasMore: page * pageSize < total,
  };
  ok(res, payload);
};
