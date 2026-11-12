export function Notice({ error, message }) {
  return error ? <p className="notice error" role="alert">{error}</p> : message ? <p className="notice success" role="status">{message}</p> : null;
}
export function LoadState({ error, retry }) {
  return error ? <div className="empty"><Notice error={error}/><button className="secondary" onClick={retry}>다시 시도</button></div> : <div className="loading" role="status"><span/>스터디를 불러오고 있어요</div>;
}
export function Field({ label, ...props }) {
  return <label className="field"><span>{label}</span><input {...props}/></label>;
}
export function Icon({ name, size = 18, ...props }) {
  const paths = {
    search: <><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></>,
    arrow: <path d="M5 12h14m-5-5 5 5-5 5"/>,
    plus: <path d="M12 5v14M5 12h14"/>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    pin: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 0 1 14 0Z"/><circle cx="12" cy="10" r="2"/></>,
    people: <><circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3m1-16a3 3 0 0 1 0 6m2 4c2 1 3 3 3 6"/></>,
    book: <><path d="M12 6C8 3 4 4 2 5v15c4-2 7-1 10 1 3-2 6-3 10-1V5c-4-2-7-1-10 1Zm0 0v15"/></>,
    chevron: <path d="m9 5 7 7-7 7"/>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name] || paths.book}</svg>;
}
export function Badge({ status }) { return <span className={'badge ' + (status === 'OPEN' ? 'open' : 'closed')}><i/>{status === 'OPEN' ? '모집 중' : '모집 마감'}</span>; }
export function Avatar({ name = '', small = false }) { return <span aria-hidden="true" className={'avatar' + (small ? ' small' : '')}>{name.slice(0, 1)}</span>; }
