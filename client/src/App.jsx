import { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { api, clearToken, getToken, saveToken } from './api';
import { LoadState, Icon } from './components/UI';
import { Login, Signup, Profile } from './pages/Account';
import Home from './pages/Home';
import MemberSummary from './pages/MemberSummary';
import { StudyForm, StudyDetail } from './pages/Study';

function Protected({ user, checking, children }) {
  const location = useLocation();
  if (checking) return <LoadState/>;
  return user ? children : <Navigate to="/login" replace state={{ from: location.pathname }}/>;
}
export default function App() {
  const [user, setUser] = useState(null), [checking, setChecking] = useState(Boolean(getToken()));
  const navigate = useNavigate(), location = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);
  useEffect(() => {
    let active = true;
    if (getToken()) api('/users/me').then(data => { if (active) setUser(data); }).catch(() => { clearToken(); })
      .finally(() => { if (active) setChecking(false); });
    const expire = () => { setUser(null); setChecking(false); };
    window.addEventListener('auth-expired', expire);
    return () => { active = false; window.removeEventListener('auth-expired', expire); };
  }, []);
  async function refreshUser() { setUser(await api('/users/me')); }
  async function login(token) { saveToken(token); try { await refreshUser(); } catch (e) { clearToken(); throw e; } }
  function logout() { clearToken(); setUser(null); }
  const protect = child => <Protected user={user} checking={checking}>{child}</Protected>;
  return <div className="app-shell"><a className="skip-link" href="#main">본문 바로가기</a>
    <header className="site-header"><div className="header-inner"><Link className="brand" to="/" aria-label="투게더 홈"><span className="brand-symbol" aria-hidden="true"><i/><i/></span>together<span className="brand-period">.</span></Link>
      <nav className="main-nav" aria-label="주 메뉴"><NavLink to="/" end>스터디 찾기</NavLink><NavLink to="/directory">작성자별 목록</NavLink><NavLink to="/members">회원별 모집 현황</NavLink></nav>
      <div className="account-nav">{user ? <><Link className="account-link" to="/mypage/edit">마이페이지</Link><button className="text-button" onClick={() => { logout(); navigate('/'); }}>로그아웃</button></> : <Link className="account-link" to="/login">로그인</Link>}<Link className="button compact" to="/write"><Icon name="plus" size={16}/>스터디 만들기</Link></div></div></header>
    <main id="main"><Routes>
      <Route path="/" element={<Home key={user?.id || 'public'} user={user}/>}/><Route path="/directory" element={<Home key={'directory-' + (user?.id || 'public')} user={user} joined/>}/>
      <Route path="/members" element={<MemberSummary/>}/>
      <Route path="/login" element={<Login onLogin={login}/>}/><Route path="/signup" element={<Signup onLogin={login}/>}/>
      <Route path="/mypage/edit" element={protect(<Profile user={user} onUpdate={refreshUser} onLogout={logout}/>)}/>
      <Route path="/write" element={protect(<StudyForm/>)}/><Route path="/study/:id" element={<StudyDetail user={user}/>}/>
      <Route path="/study/:id/edit" element={protect(<StudyDetail user={user} edit/>)}/>
      <Route path="*" element={<div className="empty"><h1>페이지를 찾을 수 없어요.</h1><Link className="button" to="/">스터디 목록으로</Link></div>}/>
    </Routes></main><footer className="site-footer"><div><Link className="brand" to="/">together.</Link><span>같이 공부하는, 우리 학교.</span></div><p>교내 스터디 모집 프로젝트 <span>20506</span></p></footer>
  </div>;
}
