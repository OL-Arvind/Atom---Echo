import { Metadata } from "next";
import { LoginClient } from "./login-client";

export const metadata: Metadata = {
  title: "Sign In · Atom & Echo",
  description: "Sign in to access the Atom & Echo agency operating workspace.",
};

export default function LoginPage() {
  return <LoginClient />;
}
