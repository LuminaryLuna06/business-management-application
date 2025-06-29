import { useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import industries from "../../data/industry.json";
import type { Industry } from "../../types/industry";

function TestPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async () => {
    setLoading(true);
    setSuccess(null);
    setError(null);
    try {
      // Upload từng ngành nghề lên Firestore
      const promises = (industries as Industry[]).map((industry) =>
        addDoc(collection(db, "industries"), industry)
      );
      await Promise.all(promises);
      setSuccess("Upload thành công tất cả ngành nghề!");
    } catch (err: any) {
      setError("Lỗi upload: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>Upload ngành nghề lên Firestore</h2>
      <button onClick={handleUpload} disabled={loading}>
        {loading ? "Đang upload..." : "Upload industry.json"}
      </button>
      {success && (
        <div style={{ color: "green", marginTop: 12 }}>{success}</div>
      )}
      {error && <div style={{ color: "red", marginTop: 12 }}>{error}</div>}
    </div>
  );
}

export default TestPage;
