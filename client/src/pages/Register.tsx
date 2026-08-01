import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Activity, Lock, Mail, RefreshCw, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { AuthShell, FieldWithIcon } from "./Login";

export function Register() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "Pulseboard — Real-time API health monitoring";
  }, []);

  useEffect(() => {
    if (isAuthenticated) navigate("/");
  }, [isAuthenticated, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^\S+@\S+\.\S+$/.test(form.email))
      return setError("Please enter a valid email address");
    if (form.password.length < 8)
      return setError("Password must be at least 8 characters");
    if (form.password !== form.confirm)
      return setError("Passwords do not match");
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success("Account created");
      navigate("/");
    } catch (err) {
      let msg = "Could not create account";
      if (axios.isAxiosError(err)) {
        if (!err.response || err.code === "ERR_NETWORK") {
          msg =
            "Unable to connect to server. Please check your internet connection.";
        } else if (err.response.status === 409) {
          msg =
            "An account with this email address already exists. Please log in.";
        } else {
          msg =
            err.response.data?.message ||
            "Account creation failed. Please try again.";
        }
      }
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start monitoring endpoints in under a minute."
      footer={
        <>
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-primary hover:underline"
          >
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <FieldWithIcon icon={User}>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            className="pl-9"
            placeholder="Jamie Rivera"
          />
        </FieldWithIcon>
        <FieldWithIcon icon={Mail}>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            className="pl-9"
            placeholder="you@company.com"
          />
        </FieldWithIcon>
        <FieldWithIcon icon={Lock}>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            className="pl-9"
            placeholder="Minimum 8 characters"
          />
        </FieldWithIcon>
        <FieldWithIcon icon={Lock}>
          <Label htmlFor="confirm">Confirm password</Label>
          <Input
            id="confirm"
            type="password"
            value={form.confirm}
            onChange={(e) => setForm({ ...form, confirm: e.target.value })}
            required
            className="pl-9"
          />
        </FieldWithIcon>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <RefreshCw className="mr-2 h-3.5 w-3.5 animate-spin" />}
          Create account
        </Button>
      </form>
    </AuthShell>
  );
}
