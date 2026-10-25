"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsPage() {
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [profilePending, startProfile] = useTransition();
  const [passwordPending, startPassword] = useTransition();

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => setUser(d.user ?? null));
  }, []);

  function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const name = new FormData(e.currentTarget).get("name");
    startProfile(async () => {
      const res = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Could not save.");
        return;
      }
      toast.success("Profile updated");
    });
  }

  function changePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    startPassword(async () => {
      const res = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "password", currentPassword: form.get("currentPassword"), newPassword: form.get("newPassword") }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Could not change password.");
        return;
      }
      toast.success("Password changed");
      formEl.reset();
    });
  }

  return (
    <>
      <SiteHeader title="Settings" />
      <main className="flex-1 p-4 md:p-6">
        <div className="mx-auto grid max-w-2xl gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Update the name shown across the dashboard.</CardDescription>
            </CardHeader>
            <CardContent>
              {user ? (
                <form onSubmit={saveProfile} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" name="name" defaultValue={user.name} required minLength={2} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={user.email} disabled />
                    <p className="text-xs text-muted-foreground">Email cannot be changed in this demo.</p>
                  </div>
                  <Button type="submit" disabled={profilePending}>
                    {profilePending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save profile
                  </Button>
                </form>
              ) : (
                <Skeleton className="h-40 w-full" />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Change password</CardTitle>
              <CardDescription>Use at least 8 characters.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={changePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current password</Label>
                  <Input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New password</Label>
                  <Input id="newPassword" name="newPassword" type="password" autoComplete="new-password" required minLength={8} />
                </div>
                <Button type="submit" disabled={passwordPending}>
                  {passwordPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Change password
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
