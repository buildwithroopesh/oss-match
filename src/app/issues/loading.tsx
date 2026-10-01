import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import LatticeLoader from "@/components/ui/LatticeLoader";

export default function IssuesLoading() {
  const pulseStyle: React.CSSProperties = {
    backgroundColor: "#1A1E22",
    borderRadius: "6px",
  };

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

      <main
        id="main-content"
        tabIndex={-1}
        style={{
          flex: 1,
          maxWidth: "960px",
          margin: "0 auto",
          padding: "40px 16px 64px",
          width: "100%",
        }}
      >
        <div
          role="status"
          aria-label="Discovering open source issues…"
          aria-busy="true"
        >
          {/* Status Bar with LatticeLoader */}
          <div
            style={{
              backgroundColor: "#15181B",
              border: "1px solid #2A2F35",
              borderRadius: "8px",
              padding: "16px 20px",
              marginBottom: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
            }}
          >
            <LatticeLoader
              label="Finding matching issues"
              doneLabel="Done in"
              errorLabel="Failed after"
              status="working"
              pattern="orbit"
              grid={3}
              shape="round"
              color="#A5ABB3"
              doneColor="#5CE1C6"
              errorColor="#F06A6A"
              glow={false}
              showTimer
            />
          </div>

          {/* Skeleton Filter Bar */}
          <div
            style={{
              backgroundColor: "#15181B",
              border: "1px solid #2A2F35",
              borderRadius: "8px",
              padding: "16px 20px",
              marginBottom: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div style={{ ...pulseStyle, width: "100%", height: "36px" }} />
            <div style={{ ...pulseStyle, width: "60%", height: "24px" }} />
          </div>

          {/* Skeleton Cards */}
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                backgroundColor: "#15181B",
                border: "1px solid #2A2F35",
                borderRadius: "8px",
                padding: "20px",
                marginBottom: "14px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <div style={{ display: "flex", gap: "10px" }}>
                <div style={{ ...pulseStyle, width: "160px", height: "16px" }} />
                <div style={{ ...pulseStyle, width: "40px", height: "16px" }} />
              </div>
              <div style={{ ...pulseStyle, width: "80%", height: "20px" }} />
              <div style={{ display: "flex", gap: "8px" }}>
                <div style={{ ...pulseStyle, width: "80px", height: "22px" }} />
                <div style={{ ...pulseStyle, width: "120px", height: "22px" }} />
                <div style={{ ...pulseStyle, width: "60px", height: "22px" }} />
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
