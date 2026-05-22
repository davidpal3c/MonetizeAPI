import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const TOKEN_COOKIE = "agnic_access_token";

type HomePageProps = {
  searchParams: Promise<{
    auth_error?: string;
    auth_error_detail?: string;
  }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const hasToken = Boolean(cookieStore.get(TOKEN_COOKIE)?.value);

  const authError = params.auth_error;
  const authErrorDetail = params.auth_error_detail;

  return (
    <main>
      <h1>MonetizeAPI</h1>
      <p>From endpoint to paid agent-ready tool.</p>

      {authError ? (
        <div
          role="alert"
          style={{
            marginBottom: "1rem",
            padding: "0.75rem 1rem",
            border: "1px solid #c62828",
            borderRadius: "6px",
            background: "#ffebee",
            color: "#b71c1c",
          }}
        >
          <strong>Sign-in failed ({authError})</strong>
          {authErrorDetail ? <p style={{ margin: "0.5rem 0 0" }}>{authErrorDetail}</p> : null}
        </div>
      ) : null}

      {hasToken ? (
        <>
          <p>Signed in with Agnic (access token stored in httpOnly cookie).</p>
          <p>
            <a href="/agnic/proof">Run Agnic model proof</a>
          </p>
        </>
      ) : (
        <p>Sign in with Agnic to obtain a user access token for model calls.</p>
      )}

      <p>
        <a href="/api/auth/sign-in">Sign in with Agnic</a>
      </p>

      <p style={{ fontSize: "0.875rem", color: "#444" }}>
        Use the same host you registered on the Agnic OAuth client (
        <code>localhost</code> or <code>127.0.0.1</code> on port 3000). In the
        Agnic client, add matching <strong>JavaScript origins</strong> and redirect
        URIs (e.g. <code>http://localhost:3000</code> locally,{" "}
        <code>https://monetize-api-six.vercel.app</code> in production).
      </p>
    </main>
  );
}
