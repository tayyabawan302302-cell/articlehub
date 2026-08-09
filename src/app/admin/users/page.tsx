import { createClient } from "@/lib/supabase/server";
import {
  suspendUser,
  changeRole,
  toggleFeaturedWriter,
  toggleVerifiedWriter,
  addPlagiarismStrike,
} from "./actions";
import {
  approveApplication,
  rejectApplication,
} from "@/lib/actions/writer-applications";

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const [
    { data: applications, error: applicationsError },
    { data: allUsers, error: usersError },
  ] = await Promise.all([
    supabase
      .from("writer_applications")
      .select(
        "id, bio, writing_interests, portfolio_url, sample_article, created_at, user:profiles!writer_applications_user_id_fkey(id, full_name, username)"
      )
      .eq("status", "pending")
      .order("created_at", { ascending: false }),

    // Only request columns that currently exist in profiles.
    supabase
      .from("profiles")
      .select(
        "id, full_name, username, role, is_suspended, is_verified, is_featured, plagiarism_strikes, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold mb-10">
        Users & Writers
      </h1>

      {/* Writer Applications */}
      <section className="mb-12">
        <h2 className="font-display text-xl font-semibold mb-4">
          Writer applications
        </h2>

        <p className="text-xs text-ink-muted mb-4">
          Applications are for users who want to become writers.
        </p>

        {applicationsError ? (
          <div className="border border-red-200 bg-red-50 rounded-lg p-4">
            <p className="text-sm text-red-700">
              Could not load writer applications.
            </p>
            <p className="text-xs text-red-600 mt-1">
              {applicationsError.message}
            </p>
          </div>
        ) : applications && applications.length > 0 ? (
          <ul className="flex flex-col gap-4">
            {applications.map((app) => {
              const user = app.user as any;

              return (
                <li
                  key={app.id}
                  className="border border-line rounded-lg p-5"
                >
                  <div className="flex items-center justify-between mb-3 gap-4">
                    <span className="font-medium">
                      {user?.full_name || "Unknown user"}{" "}
                      {user?.username && (
                        <span className="text-ink-muted font-normal">
                          @{user.username}
                        </span>
                      )}
                    </span>

                    <span className="text-xs text-ink-muted">
                      {new Date(app.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {app.bio && (
                    <p className="text-sm mb-2">
                      {app.bio}
                    </p>
                  )}

                  {app.writing_interests?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {app.writing_interests.map((interest: string) => (
                        <span
                          key={interest}
                          className="text-[11px] px-2 py-0.5 rounded-full bg-denim/15 text-denim-dark"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  )}

                  {app.portfolio_url && (
                    <a
                      href={app.portfolio_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-denim-dark underline"
                    >
                      Portfolio
                    </a>
                  )}

                  {app.sample_article && (
                    <details className="mt-3">
                      <summary className="text-xs text-ink-muted cursor-pointer">
                        Sample article
                      </summary>

                      <p className="text-sm mt-2 whitespace-pre-wrap border-l-2 border-line pl-3">
                        {app.sample_article}
                      </p>
                    </details>
                  )}

                  <div className="flex gap-2 mt-4 flex-wrap">
                    <form
                      action={async () => {
                        "use server";
                        if (user?.id) {
                          await approveApplication(app.id, user.id);
                        }
                      }}
                    >
                      <button
                        type="submit"
                        className="text-xs px-3 py-1.5 rounded-full bg-teal text-white"
                      >
                        Approve
                      </button>
                    </form>

                    <form
                      action={async (formData: FormData) => {
                        "use server";

                        if (user?.id) {
                          await rejectApplication(
                            app.id,
                            user.id,
                            (formData.get("note") as string) || ""
                          );
                        }
                      }}
                      className="flex gap-1"
                    >
                      <input
                        name="note"
                        placeholder="Reason (optional)"
                        className="input text-xs py-1 w-44"
                      />

                      <button
                        type="submit"
                        className="text-xs px-3 py-1.5 rounded-full bg-red-600 text-white"
                      >
                        Reject
                      </button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-ink-muted">
            No pending applications.
          </p>
        )}
      </section>

      {/* All Users */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display text-xl font-semibold">
              All users
            </h2>

            <p className="text-xs text-ink-muted mt-1">
              All registered users and their current roles.
            </p>
          </div>

          <span className="text-xs text-ink-muted">
            {allUsers?.length ?? 0} users
          </span>
        </div>

        {usersError ? (
          <div className="border border-red-200 bg-red-50 rounded-lg p-5">
            <p className="text-sm font-medium text-red-700">
              Could not load users.
            </p>

            <p className="text-xs text-red-600 mt-1">
              {usersError.message}
            </p>
          </div>
        ) : allUsers && allUsers.length > 0 ? (
          <div className="overflow-x-auto border border-line rounded-lg">
            <table className="w-full text-sm">
              <thead className="text-left text-ink-muted border-b border-line bg-black/[0.02]">
                <tr>
                  <th className="py-3 px-4 font-medium">Name</th>
                  <th className="py-3 px-4 font-medium">Role</th>
                  <th className="py-3 px-4 font-medium">Badges</th>
                  <th className="py-3 px-4 font-medium">Strikes</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>

              <tbody>
                {allUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-line/60 last:border-b-0"
                  >
                    <td className="py-3 px-4">
                      <div className="font-medium">
                        {user.full_name || "Unnamed user"}
                      </div>

                      {user.username && (
                        <div className="text-xs text-ink-muted">
                          @{user.username}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <form
                        action={async (formData: FormData) => {
                          "use server";

                          await changeRole(
                            user.id,
                            formData.get("role") as any
                          );
                        }}
                        className="flex items-center gap-1"
                      >
                        <select
                          name="role"
                          defaultValue={user.role}
                          className="text-xs border border-line rounded px-2 py-1 bg-transparent"
                        >
                          <option value="visitor">visitor</option>
                          <option value="writer">writer</option>
                          <option value="editor">editor</option>
                          <option value="moderator">moderator</option>
                          <option value="admin">admin</option>
                        </select>

                        <button
                          type="submit"
                          className="text-xs px-2 py-1 rounded border border-line hover:bg-black/5"
                        >
                          Set
                        </button>
                      </form>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex gap-2 flex-wrap">
                        <form
                          action={async () => {
                            "use server";
                            await toggleVerifiedWriter(
                              user.id,
                              !user.is_verified
                            );
                          }}
                        >
                          <button
                            type="submit"
                            className={`text-xs px-2 py-1 rounded-full border ${
                              user.is_verified
                                ? "border-denim text-denim-dark bg-denim/15"
                                : "border-line text-ink-muted"
                            }`}
                          >
                            {user.is_verified ? "Verified ✓" : "Verify"}
                          </button>
                        </form>

                        <form
                          action={async () => {
                            "use server";
                            await toggleFeaturedWriter(
                              user.id,
                              !user.is_featured
                            );
                          }}
                        >
                          <button
                            type="submit"
                            className={`text-xs px-2 py-1 rounded-full border ${
                              user.is_featured
                                ? "border-teal text-teal bg-teal/10"
                                : "border-line text-ink-muted"
                            }`}
                          >
                            {user.is_featured ? "Featured ★" : "Feature"}
                          </button>
                        </form>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={
                            user.plagiarism_strikes >= 3
                              ? "text-red-600 font-medium"
                              : "text-ink-muted"
                          }
                        >
                          {user.plagiarism_strikes}/3
                        </span>

                        <form
                          action={async () => {
                            "use server";
                            await addPlagiarismStrike(user.id);
                          }}
                        >
                          <button
                            type="submit"
                            className="text-xs px-2 py-1 rounded border border-line hover:bg-black/5"
                          >
                            Add strike
                          </button>
                        </form>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {user.is_suspended ? (
                        <span className="text-red-600">
                          Suspended
                        </span>
                      ) : (
                        <span className="text-teal">
                          Active
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <form
                        action={async () => {
                          "use server";
                          await suspendUser(
                            user.id,
                            !user.is_suspended
                          );
                        }}
                      >
                        <button
                          type="submit"
                          className="text-xs px-2 py-1 rounded border border-line hover:bg-black/5"
                        >
                          {user.is_suspended
                            ? "Unsuspend"
                            : "Suspend"}
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="border border-dashed border-line rounded-lg p-10 text-center">
            <p className="font-display text-lg">
              No users found.
            </p>

            <p className="text-sm text-ink-muted mt-1">
              No profiles were returned from the database.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}