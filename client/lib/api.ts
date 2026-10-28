export type FontFamilyChoice = "sans" | "serif" | "mono" | "garamond" | "modern";

export async function fetchPreview(
  markdown: string,
  fontFamily: FontFamilyChoice = "sans"
): Promise<string> {
  let endpoint = "/api/preview";

  if (process.env.NEXT_PUBLIC_API_URL) {
    endpoint = `${process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}/api/preview`;
  } else if (typeof window !== "undefined" && window.location?.origin) {
    endpoint = `${window.location.origin}/api/preview`;
  }

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markdown, fontFamily }),
    });
  } catch (err) {
    console.error("Network / fetch preview error:", err);
    throw new Error("Cannot connect to server for live preview.");
  }

  if (!response.ok) {
    let message = "Failed to render preview";
    try {
      const data = await response.json();
      if (data.error) message = data.error;
    } catch {
      // response may not be JSON
    }
    throw new Error(message);
  }

  const data = (await response.json()) as { html: string };
  return data.html;
}

export async function convertToPdf(
  markdown: string,
  pageType: "letter" | "a4" | "a3" = "a4",
  fontFamily: FontFamilyChoice = "sans"
): Promise<Blob> {
  // Determine API conversion endpoint dynamically:
  // 1. Explicit NEXT_PUBLIC_API_URL if configured during build
  // 2. Dynamic browser window.location.origin (e.g. http://localhost:4000/api/convert)
  // 3. Fallback relative '/api/convert'
  let endpoint = "/api/convert";

  if (process.env.NEXT_PUBLIC_API_URL) {
    endpoint = `${process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}/api/convert`;
  } else if (typeof window !== "undefined" && window.location?.origin) {
    endpoint = `${window.location.origin}/api/convert`;
  }

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markdown, pageType, fontFamily }),
    });
  } catch (err) {
    console.error("Network / fetch error:", err);
    throw new Error(
      "Cannot connect to conversion server. Please ensure the backend server is running."
    );
  }

  if (!response.ok) {
    let message = "Failed to convert markdown to PDF";
    try {
      const data = await response.json();
      if (data.error) message = data.error;
    } catch {
      // response may not be JSON
    }
    throw new Error(message);
  }

  return response.blob();
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}
