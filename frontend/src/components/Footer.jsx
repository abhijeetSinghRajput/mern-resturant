import React from "react";
import { Separator } from "./ui/separator";

const Footer = () => {
  return (
    <footer style={{ paddingBottom: 48 }}>
      <Separator style={{ marginBottom: 32 }} />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>✦</span>
          <span
            className="display-font"
            style={{ fontSize: 16, fontWeight: 600 }}
          >
            nouri
          </span>
        </div>
        <div style={{ display: "flex", gap: 24 }}>
          {["About", "Careers", "Partners", "Support", "Privacy"].map(
            (link) => (
              <a
                key={link}
                href="#"
                style={{
                  fontSize: 13,
                  color: "hsl(var(--muted-foreground))",
                  textDecoration: "none",
                }}
              >
                {link}
              </a>
            ),
          )}
        </div>
        <p style={{ fontSize: 12, color: "hsl(var(--muted-foreground))" }}>
          © 2025 Nouri Inc.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
