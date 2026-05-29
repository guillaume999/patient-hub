import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";

export function useAdmin() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  return { isAdmin };
}
