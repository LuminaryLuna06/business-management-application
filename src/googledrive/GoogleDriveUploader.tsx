import { useRef } from "react";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_DRIVE_CLIENT_ID; // Thay bằng client id của bạn
const SCOPES = "https://www.googleapis.com/auth/drive.file";
const FOLDER_ID = "1S2lrjpOhQwNDfox-bbi5zuKGA7N0Ziha"; // Thay bằng folderId Google Drive bạn muốn upload vào

export default function GoogleDriveUploader() {
  const accessTokenRef = useRef<string | null>(null);

  // Hàm lấy access token bằng Google Identity Services
  const getAccessToken = (callback: (token: string) => void) => {
    if (accessTokenRef.current) {
      callback(accessTokenRef.current);
      return;
    }
    // @ts-ignore
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (tokenResponse: any) => {
        accessTokenRef.current = tokenResponse.access_token;
        callback(tokenResponse.access_token);
      },
    });
    tokenClient.requestAccessToken();
  };

  // Hàm set quyền public cho file
  const setFilePublic = async (fileId: string, accessToken: string) => {
    await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + accessToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: "reader",
          type: "anyone",
        }),
      }
    );
  };

  // Hàm upload file lên Google Drive
  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    getAccessToken(async (accessToken) => {
      const metadata = {
        name: file.name,
        mimeType: file.type,
        parents: [FOLDER_ID],
      };
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
      if (data.id) {
        await setFilePublic(data.id, accessToken);
        alert("Đã upload! Link chia sẻ: " + data.webViewLink);
      } else {
        alert("Lỗi upload: " + JSON.stringify(data));
      }
    });
  };

  // Hàm đăng nhập Google (lấy access token)
  const handleSignIn = () => {
    getAccessToken(() => {
      alert("Đăng nhập thành công!");
    });
  };

  return (
    <div>
      <button onClick={handleSignIn}>Đăng nhập Google</button>
      <input type="file" onChange={handleUpload} />
    </div>
  );
}
