import { ActionFunctionArgs, json } from "@remix-run/node";
import { loginUser } from "~/services/auth/strapi.server";
import { createUserSession } from "~/services/auth/session.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const body = await request.json();
    const { identifier, password, redirectTo } = body;

    if (!identifier || !password) {
      return json({ error: "Email/username and password are required" }, { status: 400 });
    }

    // Call Strapi login service
    const loginResponse = await loginUser(identifier, password);
    const loginData = await loginResponse.json();

    // If login failed, return the error
    if (loginResponse.status !== 200) {
      return json({ error: loginData.error || "Login failed" }, { status: loginResponse.status });
    }

    // If login successful, create a session
    if (loginData.jwt && loginData.user) {
      return createUserSession(
        String(loginData.user.id),
        loginData.jwt,
        redirectTo || "/"
      );
    }

    // If we got here, something unexpected happened
    return json({ error: "Login failed" }, { status: 500 });
  } catch (error) {
    console.error("Login error:", error);
    return json({ error: "An error occurred during login" }, { status: 500 });
  }
};

// For preflight requests (important for CORS)
export const loader = async ({ request }: ActionFunctionArgs) => {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  return json({ error: "Method not allowed" }, { status: 405 });
};