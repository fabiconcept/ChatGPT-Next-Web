"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function logout() {
  // Clear all cookies
  const cookieStore = cookies();
  const allCookies = cookieStore.getAll();
  allCookies.forEach((cookie) => {
    cookieStore.delete(cookie.name);
  });

  // Clear next-auth session cookie specifically
  cookieStore.delete("next-auth.session-token");
  cookieStore.delete("next-auth.csrf-token");
  cookieStore.delete("next-auth.callback-url");

  // Redirect to signin page
  redirect("/auth/signin");
}
