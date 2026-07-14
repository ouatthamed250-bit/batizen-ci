"use client";

export default function BtpLoader({ text = "Chargement..." }: { text?: string }) {
  return (
    <div className="btp-loader">
      <div className="btp-loader-spinner" />
      <p className="btp-loader-text">{text}</p>
    </div>
  );
}