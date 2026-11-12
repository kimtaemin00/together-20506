export const subjects = ['국어', '수학', '영어', '과학', '사회', '정보', '기타'];
export const grades = ['전체', '1학년', '2학년', '3학년'];
export const subjectMark = { 국어: '가', 수학: 'x²', 영어: 'Aa', 과학: 'H₂', 사회: '世', 정보: '</>', 기타: '+' };
export const shortDate = value => new Date(value).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
