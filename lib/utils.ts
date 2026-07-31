import bcrypt from "bcrypt";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generatePIN(): string {
  return Math.floor(100_000 + Math.random() * 9_99_999).toString();
}

export function generateCalenderId(): string {
  const chars = "ZXCVBNMASDFGHJKLQWERTYUIOP";
  let id = "";

  for (let i = 0; i < 8; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

export async function hashPINForDB(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10);
}

export async function verifyPIN(pin: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(pin, hash);
}

export function generateCalendarName(): string {
  const now = new Date();

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const day = now.getDate();
  const month = months[now.getMonth()];
  const year = now.getFullYear();

  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const seconds = now.getSeconds().toString().padStart(2, "0");

  return `${day} ${month} ${year} - ${hours}:${minutes}:${seconds}`;
}

export const parseError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }

  return "An unknown error occurred";
};
