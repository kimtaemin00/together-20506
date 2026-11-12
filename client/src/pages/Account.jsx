import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Field, Notice } from '../components/UI';
export function Login({ onLogin }) {
  const navigate = useNavigate(), location = useLocation();
  const [error, setError] = useState(''), [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault(); setError(''); setBusy(true);
    const body = Object.fromEntries(new FormData(event.currentTarget));
    try { const data = await api('/users/login', { method: 'POST', body }); await onLogin(data.token); navigate(location.state?.from || '/', { replace: true }); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  return <section className="form-card"><p className="eyebrow">다시 만나서 반가워요</p><h1>로그인</h1><Notice error={error}/>
    <form onSubmit={submit}><Field label="이메일" name="email" type="email" autoComplete="username" required maxLength={100}/>
      <Field label="비밀번호" name="password" type="password" autoComplete="current-password" required/>
      <button disabled={busy}>{busy ? '로그인 중…' : '로그인'}</button></form>
    <p className="muted">처음 오셨나요? <Link to="/signup" state={location.state}>회원가입</Link></p></section>;
}
export function Signup({ onLogin }) {
  const navigate = useNavigate(), location = useLocation();
  const [error, setError] = useState(''), [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault(); setError(''); setBusy(true);
    const body = Object.fromEntries(new FormData(event.currentTarget));
    try { const data = await api('/users/signup', { method: 'POST', body }); await onLogin(data.token); navigate(location.state?.from || '/', { replace: true }); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  return <section className="form-card"><p className="eyebrow">같이 공부할 준비, 되셨나요?</p><h1>회원가입</h1><Notice error={error}/>
    <form onSubmit={submit}>
      <Field label="이메일" name="email" type="email" autoComplete="username" required maxLength={100}/>
      <Field label="비밀번호 (8자 이상)" name="password" type="password" autoComplete="new-password" required minLength={8} maxLength={72}/>
      <Field label="닉네임" name="nickname" required maxLength={50}/>
      <Field label="전화번호" name="phone_number" type="tel" autoComplete="tel" placeholder="010-0000-0000" required maxLength={20}/>
      <div className="form-row"><Field label="입학년도" name="entry_year" type="number" min="2000" max={new Date().getFullYear() + 1} defaultValue={new Date().getFullYear()} required/>
      <Field label="학번" name="student_id" inputMode="numeric" pattern="[0-9]{5}" placeholder="예: 20506" required maxLength={5}/></div>
      <button disabled={busy}>{busy ? '가입 중…' : '가입하고 시작하기'}</button>
    </form><p className="muted">이미 회원인가요? <Link to="/login" state={location.state}>로그인</Link></p></section>;
}
export function Profile({ user, onUpdate, onLogout }) {
  const [error, setError] = useState(''), [message, setMessage] = useState(''), [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  async function update(event) {
    event.preventDefault(); setError(''); setMessage(''); setBusy(true);
    const form = event.currentTarget;
    try {
      const data = await api('/users/me', { method: 'PUT', body: Object.fromEntries(new FormData(form)) });
      await onUpdate(); form.elements.currentPassword.value = ''; setMessage(data.message);
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  async function remove(event) {
    event.preventDefault();
    if (!window.confirm('탈퇴하면 회원 정보와 본인이 작성한 모집 글이 모두 삭제됩니다. 탈퇴하시겠습니까?')) return;
    setError(''); setMessage(''); setBusy(true);
    try {
      await api('/users/me', { method: 'DELETE', body: Object.fromEntries(new FormData(event.currentTarget)) });
      onLogout(); navigate('/', { replace: true });
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  return <section className="form-card"><p className="eyebrow">내 계정 관리</p><h1>마이페이지</h1><Notice error={error} message={message}/>
    <form onSubmit={update}>
      <Field label="이메일 (변경 불가)" value={user.email} readOnly/>
      <Field label="입학년도 (변경 불가)" value={user.entry_year} readOnly/>
      <Field label="닉네임" name="nickname" defaultValue={user.nickname} required maxLength={50}/>
      <Field label="전화번호" name="phone_number" defaultValue={user.phone_number} type="tel" required maxLength={20}/>
      <Field label="학번" name="student_id" defaultValue={user.student_id} pattern="[0-9]{5}" required maxLength={5}/>
      <Field label="현재 비밀번호 (수정 확인)" name="currentPassword" type="password" autoComplete="current-password" required/>
      <button disabled={busy}>프로필 저장</button>
    </form>
    <div className="danger-zone"><h2>회원 탈퇴</h2><p>탈퇴하면 내 회원 정보와 작성한 모집 글이 함께 삭제됩니다.</p>
      <form onSubmit={remove}><Field label="현재 비밀번호 (탈퇴 확인)" name="currentPassword" type="password" autoComplete="current-password" required/>
      <button className="danger" disabled={busy}>회원 탈퇴</button></form></div>
  </section>;
}
