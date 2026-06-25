export async function uploadImage(file: File): Promise<string> {
  try {
    // Try direct file upload first (works better on mobile)
    const formData = new FormData();
    formData.append("image", file);
    formData.append("key", process.env.NEXT_PUBLIC_IMGBB_API_KEY!);

    const response = await fetch("https://api.imgbb.com/1/upload", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (data.success) {
      return data.data.url;
    }

    // If direct upload fails try base64
    return await uploadAsBase64(file);

  } catch (e) {
    // Fallback to base64
    return await uploadAsBase64(file);
  }
}

async function uploadAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        const base64 = (reader.result as string).split(",")[1];
        const formData = new FormData();
        formData.append("image", base64);
        formData.append("key", process.env.NEXT_PUBLIC_IMGBB_API_KEY!);

        const response = await fetch("https://api.imgbb.com/1/upload", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (data.success) {
          resolve(data.data.url);
        } else {
          reject(new Error(data.error?.message || "Upload failed"));
        }
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
  });
}