import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  const data =
    typeof error === "object" && error !== null && "data" in error
      ? (error as { data?: { message?: unknown } }).data
      : undefined

  return typeof data?.message === "string" && data.message.length > 0
    ? data.message
    : fallback
}
