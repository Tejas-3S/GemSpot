export async function uploadImage(file: File): Promise<string> {
  // Try direct FormData upload first (best for camera)
  try {
    const result = await tryDirectUpload(file);
    if (result) return result;
  } catch (e) {
    console.log("Direct upload failed, trying base64...");
  }

  // Fallback to base64 (best for gallery)
  try {
    const result = await tryBase64Upload(file);
    if (result) return result;
  } catch (e) {
    console.log("Base64 failed, trying blob...");
  }

  // Last resort — blob upload
  return await tryBlobUpload(file);
}

async function tryDirectUpload(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("image", file);
  formData.append("key", process.env.NEXT_PUBLIC_IMGBB_API_KEY!);

  const response = await fetch("https://api.imgbb.com/1/upload", {
    method: "POST",
    body: formData,
  });

  const data = await response.json();
  if (data.success) return data.data.url;
  throw new Error("Direct upload failed");
}

async function tryBase64Upload(file: File): Promise<string> {
  const base64 = await fileToBase64(file);
  const formData = new FormData();
  formData.append("image", base64);
  formData.append("key", process.env.NEXT_PUBLIC_IMGBB_API_KEY!);

  const response = await fetch("https://api.imgbb.com/1/upload", {
    method: "POST",
    body: formData,
  });

  const data = await response.json();
  if (data.success) return data.data.url;
  throw new Error("Base64 upload failed");
}

async function tryBlobUpload(file: File): Promise<string> {
  const blob = new Blob([await file.arrayBuffer()], { type: file.type });
  const formData = new FormData();
  formData.append("image", blob, file.name || "image.jpg");
  formData.append("key", process.env.NEXT_PUBLIC_IMGBB_API_KEY!);

  const response = await fetch("https://api.imgbb.com/1/upload", {
    method: "POST",
    body: formData,
  });

  const data = await response.json();
  if (data.success) return data.data.url;
  throw new Error("Blob upload failed");
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("FileReader failed"));
    reader.readAsDataURL(file);
  });
}