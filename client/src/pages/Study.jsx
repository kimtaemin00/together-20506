import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { useData } from '../hooks/useData';
import { Avatar, Badge, Field, Icon, LoadState, Notice } from '../components/UI';
import { subjects, grades, shortDate, subjectMark } from '../study';

export function StudyForm({ initial, studyId }) {
  const navigate = useNavigate();
  const [error, setError] = useState(''), [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault(); setError(''); setBusy(true);
    const body = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const result = await api('/studies' + (studyId ? '/' + studyId : ''), { method: studyId ? 'PUT' : 'POST', body });
      navigate('/study/' + (studyId || result.studyId), { replace: true });
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  return <div className="editor-layout"><section className="form-card wide"><Link className="back" to={studyId ? '/study/' + studyId : '/'}>← 돌아가기</Link><p className="eyebrow">MAKE A STUDY</p><h1>{studyId ? '우리 스터디, 새 소식.' : '같이 공부할 친구를 찾아요.'}</h1><p className="muted">목표와 시간을 적어주면, 잘 맞는 친구가 찾아올 거예요.</p><Notice error={error}/>
    <form onSubmit={submit}>
      <Field label="스터디 이름" name="title" defaultValue={initial?.title} required maxLength={100} placeholder="예: 수학 문제집, 하루 세 문제씩 같이 풀어요"/>
      <div className="form-row"><label className="field"><span>과목</span><select name="subject" defaultValue={initial?.subject || '수학'}>{subjects.map(s => <option key={s}>{s}</option>)}</select></label>
      <label className="field"><span>대상 학년</span><select name="target_grade" defaultValue={initial?.target_grade || '전체'}>{grades.map(g => <option key={g}>{g}</option>)}</select></label></div>
      <Field label="모임 시간" name="schedule" defaultValue={initial?.schedule} required maxLength={150} placeholder="예: 매주 화·목요일 점심시간 12:40~13:10"/>
      <div className="form-row"><Field label="모임 장소" name="meeting_place" defaultValue={initial?.meeting_place} required maxLength={100} placeholder="예: 도서관 스터디 테이블"/>
      <Field label="모집 규모 (본인 포함, 2~20명)" name="capacity" type="number" min="2" max="20" step="1" defaultValue={initial?.capacity ?? 4} required/></div>
      <label className="field"><span>스터디 소개</span><textarea name="description" defaultValue={initial?.description} required maxLength={5000} rows={8} placeholder={'어떤 목표로 공부하나요?\n어떤 방식으로 진행하나요?\n관심 있는 친구는 어디에서 만나면 되나요?'}/></label>
      <p className="form-help">전화번호 등 개인 연락처 대신 교내에서 만날 장소와 시간을 안내해주세요.</p>
      <label className="field"><span>모집 상태</span><select name="status" defaultValue={initial?.status || 'OPEN'}><option value="OPEN">모집 중</option><option value="CLOSED">모집 마감</option></select></label>
      <div className="form-actions"><Link className="button secondary" to={studyId ? '/study/' + studyId : '/'}>취소</Link><button disabled={busy}>{busy ? '저장 중…' : studyId ? '변경 내용 저장' : '모집 글 등록'}<Icon name="arrow" size={17}/></button></div>
    </form></section><aside className="editor-note"><span className="eyebrow">A GOOD BEGINNING</span><h2>잘 쓴 모집 글이<br/>좋은 만남의 시작.</h2><p>거창한 계획이 아니어도 괜찮아요. 함께 지킬 수 있는 작은 목표부터 정해보세요.</p><hr/><b>이렇게 적어보세요</b><p>“문제를 각자 풀어온 뒤,<br/>어려웠던 세 문제를 설명해요.”</p><small>모집 규모는 계획한 전체 인원입니다.<br/>온라인 참가 신청 기능은 제공하지 않아요.</small></aside></div>;
}
export function StudyDetail({ user, edit = false }) {
  const { id } = useParams(), navigate = useNavigate();
  const { data: s, error, reload } = useData('/studies/' + id);
  const [actionError, setActionError] = useState(''), [busy, setBusy] = useState(false);
  if (!s) return <LoadState error={error} retry={reload}/>;
  const owner = user?.id === s.owner_id;
  if (edit) return owner ? <StudyForm key={s.id} initial={s} studyId={s.id}/> : <div className="empty"><Notice error="본인이 작성한 모집 글만 수정할 수 있습니다."/><Link to="/">스터디 목록으로</Link></div>;
  async function remove() {
    if (!window.confirm('이 모집 글을 삭제할까요? 삭제한 글은 복구할 수 없습니다.')) return;
    setBusy(true); setActionError('');
    try { await api('/studies/' + id, { method: 'DELETE' }); navigate('/', { replace: true }); }
    catch (e) { setActionError(e.message); setBusy(false); }
  }
  return <div className="detail-layout"><article className="detail"><Link className="back" to="/">← 전체 스터디</Link><div className="detail-top"><span className="subject-tag"><b>{subjectMark[s.subject]}</b>{s.subject}</span><Badge status={s.status}/></div>
    <h1>{s.title}</h1><div className="author-row"><Avatar name={s.author_nickname}/><div><strong>{s.author_nickname}</strong><small>{shortDate(s.created_at)}에 등록</small></div>{owner && <span className="own-label">내 모집 글</span>}</div>
    <div className="study-facts"><div><Icon name="clock"/><span>모임 시간<strong>{s.schedule}</strong></span></div><div><Icon name="pin"/><span>모임 장소<strong>{s.meeting_place}</strong></span></div><div><Icon name="people"/><span>대상 · 모집 규모<strong>{s.target_grade === '전체' ? '전 학년' : s.target_grade} · 본인 포함 {s.capacity}명</strong></span></div></div>
    <h2 className="intro-heading">이런 스터디예요</h2><p className="description">{s.description}</p><Notice error={actionError}/>
    {owner && <div className="actions"><Link className="button" to={'/study/' + s.id + '/edit'}>모집 글 수정</Link><button className="danger" onClick={remove} disabled={busy}>삭제</button></div>}
  </article><aside className="detail-aside"><p className="eyebrow">LET’S STUDY TOGETHER</p><h2>{s.status === 'OPEN' ? '이 스터디가 마음에 든다면?' : '이번 모집은 마감됐어요.'}</h2><p>{s.status === 'OPEN' ? '소개에 적힌 시간과 장소를 확인하고 작성자에게 교내에서 참여 의사를 전해주세요.' : '다른 스터디를 둘러보거나 직접 친구들을 모아보세요.'}</p><Link className="button secondary" to="/">다른 스터디 둘러보기 <Icon name="arrow" size={17}/></Link></aside></div>;
}
