const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export type FontFamilyChoice = "sans" | "serif" | "mono" | "garamond" | "modern";

export async function convertToPdf(
  markdown: string,
  pageType: "letter" | "a4" | "a3" = "a4",
  fontFamily: FontFamilyChoice = "sans"
): Promise<Blob> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/api/convert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markdown, pageType, fontFamily }),
    });
  } catch (err) {
    console.error("Network / fetch error:", err);
    throw new Error(
      "Cannot connect to conversion server. Please ensure the backend server is running on port 4000."
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
