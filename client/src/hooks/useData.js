import { useEffect, useState } from 'react';
import { api } from '../api';
export function useData(path) {
  const [result, setResult] = useState({ path: '', data: null, error: '' });
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let active = true;
    api(path).then(data => { if (active) setResult({ path, data, error: '' }); })
      .catch(error => { if (active) setResult({ path, data: null, error: error.message }); });
    return () => { active = false; };
  }, [path, version]);
  return { data: result.path === path ? result.data : null, error: result.path === path ? result.error : '', reload: () => setVersion(v => v + 1) };
}
