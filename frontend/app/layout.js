import './globals.css';

export const metadata = {
  title: 'ECO-DRIVE INSIGHT',
  description: 'AI 기반 구간별 연비 최적화 진단 서비스'
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
