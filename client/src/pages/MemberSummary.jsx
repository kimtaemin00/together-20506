import { useData } from '../hooks/useData';
import { Avatar, LoadState } from '../components/UI';

export default function MemberSummary() {
  const { data, error, reload } = useData('/studies/member-summary');
  return <section>
    <div className="page-heading"><p className="eyebrow">MEMBER ACTIVITY</p><h1>함께 만드는 스터디.</h1><p className="muted">회원별로 작성한 모집 글과 현재 모집 상태를 살펴보세요.</p></div>
    <div className="section-heading"><div><p className="eyebrow">STUDY OVERVIEW</p><h2>회원별 모집 현황 <span>{data ? data.length : '—'}</span></h2></div><button className="text-button" onClick={reload}>새로고침</button></div>
    {!data ? <LoadState error={error} retry={reload}/> : !data.length ? <div className="empty"><h3>아직 가입한 회원이 없어요</h3><p>회원이 가입하면 이곳에 모집 현황이 표시됩니다.</p></div> :
      <div className="table-wrap member-summary"><table><caption className="sr-only">회원별 전체 모집 글 수, 모집 중인 글 수, 마감된 글 수</caption><thead><tr><th scope="col">회원</th><th scope="col">전체 글</th><th scope="col">모집 중</th><th scope="col">모집 마감</th></tr></thead>
        <tbody>{data.map(member => <tr key={member.member_id}><td><span className="table-author"><Avatar name={member.nickname} small/>{member.nickname}</span></td><td>{member.total_count}건</td><td>{member.open_count}건</td><td>{member.closed_count}건</td></tr>)}</tbody></table></div>}
    <p className="muted summary-note">모집 글을 작성하지 않은 회원도 표시돼요. 인원수가 아닌 게시글 수를 집계합니다.</p>
  </section>;
}
