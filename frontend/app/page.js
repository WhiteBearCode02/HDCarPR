'use client';

import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const API = process.env.NEXT_PUBLIC_API_BASE;

export default function HomePage() {
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [drives, setDrives] = useState([]);
  const [msg, setMsg] = useState('');

  const chartData = useMemo(
    () =>
      drives.map((d) => ({
        name: new Date(d.start_time).toLocaleDateString(),
        fuel: Number(d.avg_fuel_economy)
      })),
    [drives]
  );

  const login = async () => {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) return setMsg(data.message || '로그인 실패');
    setToken(data.token);
    setMsg(`로그인 성공: ${data.user.email}`);
  };

  const loadDrives = async () => {
    const res = await fetch(`${API}/drives`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) return setMsg(data.message || '조회 실패');
    setDrives(data);
  };

  return (
    <main style={{ maxWidth: 960, margin: '0 auto' }}>
      <h1>ECO-DRIVE INSIGHT</h1>
      <p>AI 기반 구간별 연비 최적화 진단 MVP 대시보드</p>

      <section style={{ background: '#fff', padding: 16, borderRadius: 8, marginBottom: 16 }}>
        <h3>로그인</h3>
        <input placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ marginRight: 8 }} />
        <input placeholder="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ marginRight: 8 }} />
        <button onClick={login}>로그인</button>
        <p>{msg}</p>
      </section>

      <section style={{ background: '#fff', padding: 16, borderRadius: 8, marginBottom: 16 }}>
        <h3>주행 기록</h3>
        <button onClick={loadDrives} disabled={!token}>주행 목록 조회</button>
        <ul>
          {drives.map((d) => (
            <li key={d.id}>{new Date(d.start_time).toLocaleString()} - 평균연비 {d.avg_fuel_economy} km/L</li>
          ))}
        </ul>
      </section>

      <section style={{ background: '#fff', padding: 16, borderRadius: 8 }}>
        <h3>연비 시각화</h3>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="fuel" fill="#0088FE" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </main>
  );
}
