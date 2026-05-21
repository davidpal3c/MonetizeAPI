import Link from "next/link";
import { cookies } from "next/headers";

const TOKEN_COOKIE = "agnic_access_token";

export default async function HomePage() {
  const cookieStore = await cookies();
  const hasToken = Boolean(cookieStore.get(TOKEN_COOKIE)?.value);

  return (
    <main>
      <h1>MonetizeAPI</h1>
      <p>From endpoint to paid agent-ready tool.</p>

      {hasToken ? (
        <p>Signed in with Agnic (access token stored in httpOnly cookie).</p>
      ) : (
        <p>Sign in with Agnic to obtain a user access token for model calls.</p>
      )}

      <p>
        <Link href="/api/auth/sign-in">Sign in with Agnic</Link>
      </p>

      <p style={{ fontSize: "0.875rem", color: "#444" }}>
        Use the same host you registered on the Agnic OAuth client (
        <code>localhost</code> or <code>127.0.0.1</code> on port 3000).
      </p>
    </main>
  );
}
