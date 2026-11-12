export function reject(message, status = 400) {
  const error = new Error(message); error.status = status; throw error;
}
export function text(value, label, max, min = 1) {
  if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max) reject(label + ': ' + min + '~' + max + '자로 입력하세요.');
  return value.trim();
}
export function password(value) {
  if (typeof value !== 'string' || value.length < 8 || Buffer.byteLength(value, 'utf8') > 72) reject('비밀번호는 8자 이상, UTF-8 기준 72바이트 이하로 입력하세요.');
  return value;
}
export function profile(body) {
  const nickname = text(body.nickname, '닉네임', 50);
  const phone = text(body.phone_number, '전화번호', 20);
  const student = text(body.student_id, '학번', 10);
  if (!/^[0-9+() -]{7,20}$/.test(phone)) reject('전화번호 형식을 확인하세요.');
  if (!/^\d{5}$/.test(student)) reject('학번은 20506처럼 숫자 5자리로 입력하세요.');
  return { nickname, phone_number: phone, student_id: student };
}
export function id(value) {
  if (!/^\d+$/.test(String(value)) || !Number.isSafeInteger(Number(value)) || Number(value) < 1) reject('올바른 모집 글 번호가 아닙니다.');
  return Number(value);
}
export function study(body) {
  const data = {
    title: text(body.title, '제목', 100), description: text(body.description, '스터디 소개', 5000),
    subject: body.subject, meeting_place: text(body.meeting_place, '모임 장소', 100),
    schedule: text(body.schedule, '모임 시간', 150), target_grade: body.target_grade || '전체',
    status: body.status || 'OPEN',
  };
  if (!['국어','수학','영어','과학','사회','정보','기타'].includes(data.subject)) reject('과목을 선택하세요.');
  if (!['전체','1학년','2학년','3학년'].includes(data.target_grade)) reject('대상 학년을 확인하세요.');
  if (!['OPEN','CLOSED'].includes(data.status)) reject('모집 상태를 확인하세요.');
  const capacity = Number(body.capacity);
  if (!Number.isInteger(capacity) || capacity < 2 || capacity > 20) reject('모집 규모는 2~20명의 정수로 입력하세요.');
  return { ...data, capacity };
}
