export async function uploadImage(file: File): Promise<string> {
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
  } else {
    throw new Error("Image upload failed");
  }
}