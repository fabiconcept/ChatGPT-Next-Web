"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./playground.module.scss";
import Locale from "../locales";
import { useSession } from "next-auth/react";

export default function PlaygroundPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [url, setUrl] = useState("");
  const [method, setMethod] = useState("GET");
  const [requestBody, setRequestBody] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Protect the route
  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (status === "unauthenticated") {
    router.push("/auth/signin");
    return null;
  }

  const handleRequest = async () => {
    try {
      setLoading(true);
      setError("");

      const options: RequestInit = {
        method,
        headers: {
          "Content-Type": "application/json",
          "user-id": session?.user?.id ?? "",
        },
      };

      if (method !== "GET" && requestBody) {
        try {
          options.body = JSON.stringify(JSON.parse(requestBody));
        } catch (e) {
          setError("Invalid JSON in request body");
          return;
        }
      }

      const baseUrl = window.location.origin;
      const fullUrl = url.startsWith("/") ? `${baseUrl}${url}` : url;

      const res = await fetch(fullUrl, options);
      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch (e) {
      setError(e instanceof Error ? e.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{Locale.Playground.Title}</h1>
      </div>

      <div className={styles.content}>
        <div className={styles.inputSection}>
          <div className={styles.urlContainer}>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className={styles.methodSelect}
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
            </select>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="/api/..."
              className={styles.urlInput}
            />
            <button
              onClick={handleRequest}
              disabled={loading || !url}
              className={styles.sendButton}
            >
              {loading ? "Sending..." : "Send"}
            </button>
          </div>

          {method !== "GET" && (
            <div className={styles.bodyContainer}>
              <textarea
                value={requestBody}
                onChange={(e) => setRequestBody(e.target.value)}
                placeholder="Request body (JSON)"
                className={styles.bodyInput}
              />
            </div>
          )}
        </div>

        <div className={styles.responseSection}>
          {error && <div className={styles.error}>{error}</div>}
          <pre className={styles.response}>
            {response || "Response will appear here"}
          </pre>
        </div>
      </div>
    </div>
  );
}
