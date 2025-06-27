import { useEffect, useRef } from "react";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_DRIVE_CLIENT_ID; // Thay bằng client id của bạn
const API_KEY = "YOUR_API_KEY"; // Có thể không cần nếu chỉ upload
const SCOPES = "https://www.googleapis.com/auth/drive.file";
const FOLDER_ID = "YOUR_FOLDER_ID"; // Thay bằng folderId Google Drive bạn muốn upload vào

export default function GoogleDriveUploader() {
  const gapiLoaded = useRef(false);

  useEffect(() => {
    if (!gapiLoaded.current) {
      (window as any).gapi.load("client:auth2", initClient);
      gapiLoaded.current = true;
    }
  }, []);

  function initClient() {
    (window as any).gapi.client
      .init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        scope: SCOPES,
        discoveryDocs: [
          "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest",
        ],
      })
      .then(() => {
        // Đã sẵn sàng xác thực
      });
  }

  function handleSignIn() {
    (window as any).gapi.auth2.getAuthInstance().signIn();
  }

  function handleSignOut() {
    (window as any).gapi.auth2.getAuthInstance().signOut();
  }

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const metadata = {
      name: file.name,
      mimeType: file.type,
      parents: [FOLDER_ID],
    };
    const accessToken = (window as any).gapi.auth.getToken().access_token;
    const form = new FormData();
    form.append(
      "metadata",
      new Blob([JSON.stringify(metadata)], { type: "application/json" })
    );
    form.append("file", file);

    const res = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink,webContentLink",
      {
        method: "POST",
        headers: new Headers({ Authorization: "Bearer " + accessToken }),
        body: form,
      }
    );
    const data = await res.json();
    alert("Đã upload! Link: " + data.webViewLink);
  }

  return (
    <div>
      <button onClick={handleSignIn}>Đăng nhập Google</button>
      <button onClick={handleSignOut}>Đăng xuất</button>
      <input type="file" onChange={handleUpload} />
    </div>
  );
}
