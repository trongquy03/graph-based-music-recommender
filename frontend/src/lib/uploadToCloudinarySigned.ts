export const uploadToCloudinarySigned = async (
  file: File,
  resourceType: "image" | "video" | "auto" = "auto"
): Promise<string> => {
  try {
    const sigRes = await fetch("/api/cloudinary/signature");
    if (!sigRes.ok) throw new Error("Failed to fetch Cloudinary signature");

    const { signature, timestamp,cloudName, apiKey, folder } = await sigRes.json();
    console.log("➡️ Signature API response:", { cloudName, signature, timestamp, apiKey, folder });


    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", apiKey);
    formData.append("timestamp", timestamp.toString());
    formData.append("signature", signature);
    formData.append("folder", folder);

    

    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
      { method: "POST", body: formData }
    );

    const data = await uploadRes.json();

    if (!uploadRes.ok || !data.secure_url) {
      const message = data?.error?.message || "Unknown upload error";
      
      throw new Error("Upload failed: " + message);
    }

    return data.secure_url;
  } catch (error: any) {
    console.error("Cloudinary upload error:", error.message);
    throw error;
  }
};
