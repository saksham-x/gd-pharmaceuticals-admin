import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginAdmin } from "../../services/auth/authService";

import { FormLabel } from "../../components/FormField";
import PasswordInput from "../../components/PasswordInput";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      await loginAdmin({
        email,
        password,
      });

      // "/" sends each role to the first
      // page it can open.
      navigate("/");
    } catch (error: any) {
      console.error(error);

      setError(
        error?.response?.data?.message ||
          "Invalid email or password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(115deg,#ffffff_0%,#f4f9fc_55%,#eaf5ff_55%)] px-4 dark:bg-soft">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-8 shadow-[0_16px_23px_rgba(23,50,77,.1)]">
        <div className="text-center">
          <span className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-[13px_13px_13px_5px] border border-[#1266B1] font-display text-xl font-bold text-[#1266B1]">
            G
          </span>

          <p className="text-xs font-bold tracking-[1.5px] text-[#147d64] uppercase">
            Staff portal
          </p>

          <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-ink">
            G.D. Pharmaceuticals
          </h1>

          <p className="mt-2 text-sm text-muted">
            Sign in to manage enquiries and the website.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-5"
        >
          <div>
            <FormLabel
              label="Email"
              required
            />

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              placeholder="you@gdpharmaceuticals.com"
              required
              className="w-full rounded-lg border border-line bg-surface px-4 py-3 outline-none focus:border-[#1266B1]"
            />
          </div>

          <div>
            <FormLabel
              label="Password"
              required
            />

            <PasswordInput
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder="Enter password"
              required
              className="w-full rounded-lg border border-line bg-surface py-3 pl-4 pr-12 outline-none focus:border-[#1266B1]"
            />
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#1266B1] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0e5698] disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}