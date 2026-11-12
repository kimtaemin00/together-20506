import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../hooks/useData';
import { Avatar, Badge, Icon, LoadState } from '../components/UI';
import { subjects, subjectMark, shortDate } from '../study';

function StudyCard({ study: s }) {
  return <Link className={'study-card' + (s.status === 'CLOSED' ? ' is-closed' : '')} to={'/study/' + s.id}>
    <div className="card-top"><span className={'subject-tag subject-' + subjects.indexOf(s.subject)}><b>{subjectMark[s.subject]}</b>{s.subject}</span><Badge status={s.status}/></div>
    <h3>{s.title}</h3><p className="card-description">{s.description}</p>
    <dl className="card-details"><div><dt><Icon name="clock"/><span className="sr-only">시간</span></dt><dd>{s.schedule}</dd></div>
    <div><dt><Icon name="pin"/><span className="sr-only">장소</span></dt><dd>{s.meeting_place}</dd></div>
    <div><dt><Icon name="people"/><span className="sr-only">규모</span></dt><dd>{s.target_grade === '전체' ? '전 학년' : s.target_grade} · {s.capacity}명 규모</dd></div></dl>
    <div className="card-bottom"><span><Avatar name={s.author_nickname} small/>{s.author_nickname}</span><time dateTime={s.created_at}>{shortDate(s.created_at)}</time><Icon name="arrow" size={16}/></div>
  </Link>;
}
export default function Home({ user, joined = false }) {
  const { data, error, reload } = useData('/studies');
  const [subject, setSubject] = useState('전체');
  const [query, setQuery] = useState('');
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [onlyMine, setOnlyMine] = useState(false);
  const list = data?.filter(s => (subject === '전체' || s.subject === subject) && (!onlyOpen || s.status === 'OPEN') && (!onlyMine || s.owner_id === user?.id) && [s.title,s.description,s.meeting_place,s.author_nickname].some(v => v.toLowerCase().includes(query.trim().toLowerCase())));
  function reset() { setSubject('전체'); setQuery(''); setOnlyOpen(false); setOnlyMine(false); }
  return <>
    {joined ? <div className="page-heading"><p className="eyebrow">STUDY DIRECTORY</p><h1>스터디와 만든 사람들.</h1><p className="muted">모집 글과 작성자 정보를 한곳에서 확인하세요.</p></div> :
    <section className="hero" aria-labelledby="hero-title"><div className="hero-copy"><p className="eyebrow"><span className="tiny-line"/> OUR SCHOOL, OUR STUDY</p><h1 id="hero-title">혼자 막혔다면,<br/>같이 풀어봐.</h1><p>같은 목표를 가진 친구와, 우리 학교에서.<br/>너에게 맞는 스터디를 찾아보세요.</p><a className="button" href="#studies">스터디 둘러보기 <Icon name="arrow"/></a></div>
      <div className="hero-art" aria-hidden="true"><div className="art-note"><span>STUDY TOGETHER</span><strong>오늘의 목표</strong><div className="note-line"><i>✓</i> 모르는 건 같이 묻기</div><div className="note-line"><i>✓</i> 아는 건 서로 나누기</div><div className="note-line"><i/> 한 걸음 더 나아가기</div><small>A LITTLE BETTER, TOGETHER.</small></div><div className="art-stamp">같이의<br/><b>가능성.</b><span>TOGETHER CLUB</span></div><div className="pencil"/></div>
    </section>}
    <div className={joined ? 'directory-layout' : 'board-layout'}><section className="board" id="studies" aria-labelledby="board-title">
      <div className="section-heading"><div><p className="eyebrow">{joined ? 'MEMBERS & STUDIES' : 'FIND YOUR STUDY'}</p><h2 id="board-title">{joined ? '작성자별 모집 목록' : '함께할 스터디'} <span>{data ? data.length : '—'}</span></h2></div><Link className="text-link" to="/write">모집 글 쓰기 <Icon name="plus" size={16}/></Link></div>
      <div className="subject-tabs" aria-label="과목 필터">{['전체',...subjects].map(c => <button key={c} className={c === subject ? 'active' : ''} aria-pressed={c === subject} onClick={() => setSubject(c)}>{c}</button>)}</div>
      <div className="board-tools"><label className="search"><Icon name="search"/><input aria-label="스터디 검색" placeholder="제목, 장소, 작성자로 찾아보기" value={query} onChange={e => setQuery(e.target.value)}/>{query && <button className="clear-search" aria-label="검색어 지우기" onClick={() => setQuery('')}>×</button>}</label>
      <label className="check"><input type="checkbox" checked={onlyOpen} onChange={e => setOnlyOpen(e.target.checked)}/>모집 중만</label></div>
      <div className="list-meta"><span>{data ? `${list.length}개의 ${joined ? '모집 글' : '스터디'}` : '목록 확인 중'}<span className="separator">/</span>최근 등록순</span><div>{user && <button aria-pressed={onlyMine} className={'text-button' + (onlyMine ? ' selected' : '')} onClick={() => setOnlyMine(!onlyMine)}>{onlyMine ? '전체 글 보기' : '내 모집 글'}</button>}<button className="text-button" onClick={reload}>새로고침</button></div></div>
      {!data ? <LoadState error={error} retry={reload}/> : !list.length ? <div className="empty"><span className="empty-icon"><Icon name="book" size={32}/></span><h3>{data.length ? '조건에 맞는 스터디가 없어요' : '첫 스터디의 시작은 너로부터.'}</h3><p>{data.length ? '다른 과목이나 검색어로 다시 찾아보세요.' : '같이 공부하고 싶은 과목과 시간을 알려주세요.'}</p>{data.length ? <button className="secondary" onClick={reset}>필터 초기화</button> : <Link className="button" to="/write">첫 모집 글 쓰기 <Icon name="plus" size={16}/></Link>}</div> :
      joined ? <div className="table-wrap"><table><thead><tr><th>스터디</th><th>작성자</th><th>시간 · 장소</th><th>규모</th><th>상태</th></tr></thead><tbody>{list.map(s => <tr key={s.id}><td><small>{s.subject}</small><Link to={'/study/' + s.id}>{s.title}</Link></td><td><span className="table-author"><Avatar name={s.author_nickname} small/>{s.author_nickname}</span></td><td>{s.schedule}<small>{s.meeting_place}</small></td><td>{s.capacity}명</td><td><Badge status={s.status}/></td></tr>)}</tbody></table></div> :
      <div className="study-grid">{list.map(s => <StudyCard key={s.id} study={s}/>)}</div>}
    </section>{!joined && <aside className="board-aside"><section className="create-note"><span className="aside-index">01 / START SOMETHING</span><Icon name="book" size={32}/><h2>찾는 스터디가<br/>아직 없다면?</h2><p>배우고 싶은 것 하나면 충분해요.<br/>먼저 친구들을 모아보세요.</p><Link className="button" to="/write">스터디 만들기 <Icon name="plus" size={16}/></Link></section>
    <section className="guide-note"><p className="eyebrow">TOGETHER GUIDE</p><h3>좋은 시작을 위한 작은 약속</h3><ol><li><b>목표는 구체적으로</b><span>어떤 내용을 공부할지 알려주세요.</span></li><li><b>시간과 장소는 정확하게</b><span>친구들이 참여를 계획할 수 있게요.</span></li><li><b>모집이 끝나면 마감하기</b><span>내 글 수정에서 상태를 바꿔주세요.</span></li></ol><Link to="/directory">작성자별 목록 보기 <Icon name="arrow" size={15}/></Link></section>
    <p className="aside-foot">작은 질문 하나가<br/>함께 공부하는 이유가 되니까.</p></aside>}</div>
  </>;
}
