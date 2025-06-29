const CLIENT_ID = import.meta.env.VITE_GOOGLE_DRIVE_CLIENT_ID; // Thay bằng client id của bạn
const SCOPES = "https://www.googleapis.com/auth/drive.file";

const getStoredToken = () => localStorage.getItem("gdrive_token");
const setStoredToken = (token: string) =>
  localStorage.setItem("gdrive_token", token);

// Hàm lấy access token bằng Google Identity Services
export function getAccessToken(callback: (token: string) => void) {
  const storedToken = getStoredToken();
  if (storedToken) {
    callback(storedToken);
    return;
  }
  try {
    // @ts-ignore
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (tokenResponse: any) => {
        setStoredToken(tokenResponse.access_token);
        callback(tokenResponse.access_token);
      },
    });
    tokenClient.requestAccessToken();
  } catch (err: any) {
    alert(
      "Không thể mở cửa sổ đăng nhập Google. Có thể trình duyệt đã chặn popup. Vui lòng kiểm tra lại cài đặt trình duyệt hoặc thử lại."
    );
  }
}

// Hàm set quyền public cho file
export async function setFilePublic(fileId: string, accessToken: string) {
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
}

// Hàm upload file lên Google Drive
export async function uploadFileToDrive({
  file,
  folderId,
}: {
  file: File;
  folderId: string;
}): Promise<string> {
  return new Promise((resolve, reject) => {
    getAccessToken(async (accessToken) => {
      const metadata = {
        name: file.name,
        mimeType: file.type,
        parents: [folderId],
      };
      const form = new FormData();
      form.append(
        "metadata",
        new Blob([JSON.stringify(metadata)], { type: "application/json" })
      );
      form.append("file", file);
      try {
        const res = await fetch(
          "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink,webContentLink",
          {
            method: "POST",
            headers: new Headers({ Authorization: "Bearer " + accessToken }),
            body: form,
          }
        );
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("gdrive_token");
          alert(
            "Phiên đăng nhập đã hết hạn, vui lòng nhấn 'Đăng nhập Google' để đăng nhập lại!"
          );
          reject("Token expired");
          return;
        }
        const data = await res.json();
        if (data.id) {
          await setFilePublic(data.id, accessToken);
          resolve(data.webViewLink);
        } else {
          reject(data);
        }
      } catch (err) {
        reject(err);
      }
    });
  });
}
