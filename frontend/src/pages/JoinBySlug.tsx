import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { sessionsApi } from "@/lib/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { getErrorMessage } from "@/lib/errors";

export default function JoinBySlug() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, initialized } = useAuthStore();
  const [status, setStatus] = useState<"resolving" | "joining" | "error">(
    "resolving",
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!initialized || !slug) return;

    // Not logged in → remember destination, go to login
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(`/join/${slug}`)}`, {
        replace: true,
      });
      return;
    }

    const run = async () => {
      try {
        setStatus("resolving");
        const session = await sessionsApi.resolve(slug);

        setStatus("joining");
        const result = await sessionsApi.join(session.id, user.id);
        toast.success("Joined session!");
        navigate(`/room/${result.id}`, { replace: true });
      } catch (err) {
        setStatus("error");
        setMessage(getErrorMessage(err, "Could not join session"));
      }
    };

    run();
  }, [slug, user, initialized, navigate]);

  if (status === "error") {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-semibold mb-2">Couldn't join</h1>
          <p className="text-neutral-400 mb-6">{message}</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 rounded-lg font-medium"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center">
      <div className="text-center">
        <Loader2
          size={32}
          className="animate-spin mx-auto mb-4 text-violet-400"
        />
        <p className="text-neutral-400">
          {status === "resolving" ? "Finding session..." : "Joining..."}
        </p>
      </div>
    </div>
  );
}
