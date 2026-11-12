const key = 'together_token';
export const getToken = () => sessionStorage.getItem(key);
export const saveToken = (token) => sessionStorage.setItem(key, token);
export const clearToken = () => { sessionStorage.removeItem(key); localStorage.removeItem('token'); };

export async function api(path, options = {}) {
  const token = getToken();
  let response;
  try {
    response = await fetch('/api' + path, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}), ...options.headers },
      ...(options.body ? { body: JSON.stringify(options.body) } : {}),
    });
  } catch { throw new Error('서버에 연결할 수 없습니다. 실행 중인 터미널을 확인하세요.'); }
  const data = await response.json().catch(() => ({ message: '서버 응답을 확인할 수 없습니다.' }));
  if (!response.ok) {
    if (response.status === 401 && token) { clearToken(); window.dispatchEvent(new Event('auth-expired')); }
    const error = new Error(data.message || '요청에 실패했습니다.'); error.status = response.status; throw error;
  }
  return data;
}
