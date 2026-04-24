'use client';

import { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line
} from 'recharts';

const API = process.env.NEXT_PUBLIC_API_BASE;

export default function HomePage() {
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [carModel, setCarModel] = useState('Avante');
  const [carYear, setCarYear] = useState('2023');
  const [drives, setDrives] = useState([]);
  const [message, setMessage] = useState('아직 로그인하지 않았습니다.');

  const chartData = useMemo(
    () =>
      drives.map((d, idx) => ({
        name: `주행 ${idx + 1}`,
        fuel: Number(d.avg_fuel_economy),
        distance: Number(d.total_distance)
      })),
    [drives]
  );

  const avgFuel = useMemo(() => {
    if (!drives.length) return 0;
    const sum = drives.reduce((acc, cur) => acc + Number(cur.avg_fuel_economy), 0);
    return (sum / drives.length).toFixed(2);
  }, [drives]);

  const totalDistance = useMemo(() => {
    return drives.reduce((acc, cur) => acc + Number(cur.total_distance), 0).toFixed(1);
  }, [drives]);

  const handleRegister = async () => {
    setMessage('회원가입 진행 중...');
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        car_model: carModel,
        car_year: Number(carYear)
      })
    });

    const data = await res.json();
    if (!res.ok) return setMessage(data.message || '회원가입 실패');
    setMessage(`회원가입 성공: ${data.email} / 로그인 후 주행 기록을 조회하세요.`);
  };

  const handleLogin = async () => {
    setMessage('로그인 중...');
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) return setMessage(data.message || '로그인 실패');
    setToken(data.token);
    setMessage(`로그인 성공: ${data.user.email}`);
  };

  const loadDrives = async () => {
    if (!token) return setMessage('먼저 로그인해주세요.');
    setMessage('주행 데이터를 불러오는 중...');
    const res = await fetch(`${API}/drives`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();
    if (!res.ok) return setMessage(data.message || '주행 목록 조회 실패');
    setDrives(data);
    setMessage(`주행 기록 ${data.length}건을 불러왔습니다.`);
  };

  return (
    <main className="container">
      <header className="header">
        <div className="brand">
          <h1>ECO-DRIVE INSIGHT</h1>
          <p>차량 데이터 + AI 인과 분석 기반 구간별 연비 최적화 코치</p>
        </div>
        <span className="badge">MVP Dashboard v1</span>
      </header>

      <section className="grid" style={{ marginBottom: 16 }}>
        <article className="card col-4">
          <h3>평균 연비</h3>
          <div className="kpi">{avgFuel} km/L</div>
          <p>최근 조회된 주행 기록 기준</p>
        </article>
        <article className="card col-4">
          <h3>총 주행 거리</h3>
          <div className="kpi">{totalDistance} km</div>
          <p>드라이브 로그 누적 합계</p>
        </article>
        <article className="card col-4">
          <h3>분석 준비도</h3>
          <div className="kpi">{drives.length} logs</div>
          <p>AI 분석은 주행별 세그먼트 데이터 필요</p>
        </article>
      </section>

      <section className="grid">
        <article className="card col-5">
          <h3>계정 연결</h3>
          <p className="helper">테스트를 위해 자체 회원가입/로그인을 먼저 진행하세요.</p>
          <div className="row">
            <input className="input" placeholder="이메일" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="row" style={{ marginTop: 10 }}>
            <input className="input" type="password" placeholder="비밀번호(8자+)" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="row" style={{ marginTop: 10 }}>
            <input className="input" placeholder="차종" value={carModel} onChange={(e) => setCarModel(e.target.value)} />
            <input className="input" placeholder="연식" value={carYear} onChange={(e) => setCarYear(e.target.value)} />
          </div>
          <div className="row" style={{ marginTop: 10 }}>
            <button className="btn btn-secondary" onClick={handleRegister}>회원가입</button>
            <button className="btn btn-primary" onClick={handleLogin}>로그인</button>
          </div>

          <p className={token ? 'status-ok' : 'status-error'} style={{ marginTop: 12 }}>{message}</p>
        </article>

        <article className="card col-7">
          <h3>연비 트렌드</h3>
          <div className="row" style={{ marginBottom: 10 }}>
            <button className="btn btn-primary" onClick={loadDrives}>주행 기록 불러오기</button>
          </div>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#29406d" />
                <XAxis dataKey="name" stroke="#9fb0d0" />
                <YAxis stroke="#9fb0d0" />
                <Tooltip />
                <Bar dataKey="fuel" fill="#40a9ff" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="card col-8">
          <h3>주행 거리 대비 연비</h3>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#29406d" />
                <XAxis dataKey="distance" stroke="#9fb0d0" />
                <YAxis stroke="#9fb0d0" />
                <Tooltip />
                <Line type="monotone" dataKey="fuel" stroke="#00d2a8" strokeWidth={3} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="card col-4">
          <h3>AI 코칭 예시</h3>
          <ul className="list">
            <li><span>급가속 영향 42%</span><span>가속 페달 완화</span></li>
            <li><span>교통정체 영향 31%</span><span>경로 변경 추천</span></li>
            <li><span>공조부하 영향 18%</span><span>외기순환 활용</span></li>
          </ul>
          <p className="helper" style={{ marginTop: 12 }}>
            실제 수치는 백엔드 `/drives/:id/analyze` 호출 결과와 연동됩니다.
          </p>
        </article>

        <article className="card col-12">
          <h3>최근 주행 로그</h3>
          {!drives.length ? (
            <p className="helper">표시할 주행 로그가 없습니다. 상단에서 로그인을 완료한 뒤 불러오기를 눌러주세요.</p>
          ) : (
            <ul className="list">
              {drives.map((d) => (
                <li key={d.id}>
                  <span>{new Date(d.start_time).toLocaleString()} ~ {new Date(d.end_time).toLocaleString()}</span>
                  <span>{d.total_distance} km / {d.avg_fuel_economy} km/L</span>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>
    </main>
  );
}
