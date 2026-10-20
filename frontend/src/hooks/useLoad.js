import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

/** GET `path` on mount and whenever `deps` change. Returns [data, error, reload]. */
export default function useLoad(path, deps = []) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const reload = () => api(path).then(setData).catch((e) => setErr(e.message));
  useEffect(() => { reload(); }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  return [data, err, reload];
}
