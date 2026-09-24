import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { ProfileSkeleton } from "@/components/profile";

export default function ProfileLoading() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#0E1012",
      }}
    >
      <Navbar />
      <main id="main-content" style={{ flex: 1 }}>
        <ProfileSkeleton />
      </main>
      <Footer />
    </div>
  );
}
