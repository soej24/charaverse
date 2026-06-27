import "./globals.css";

export const metadata = {
  title: "CharaVerse",
  description: "AI로 캐릭터를 만들고 굿즈까지 — IP 제작 스튜디오",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
