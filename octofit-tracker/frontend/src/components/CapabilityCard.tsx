import { useEffect, useState, type ReactNode } from 'react';
import { getJson } from '../api/client.js';

type ApiItem = Record<string, unknown>;
type Props = {
  title: string;
  description: string;
  endpoint: string;
  dataKey: string;
  emptyMessage: string;
  renderItem: (item: ApiItem, index: number) => ReactNode;
};

export function CapabilityCard({ title, description, endpoint, dataKey, emptyMessage, renderItem }: Props) {
  const [items, setItems] = useState<ApiItem[]>([]);
  const [state, setState] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    let isCurrent = true;
    setState('loading');
    getJson<Record<string, unknown>>(endpoint)
      .then((data) => {
        if (!isCurrent) return;
        const result = data[dataKey];
        setItems(Array.isArray(result) ? result as ApiItem[] : []);
        setState('success');
      })
      .catch(() => {
        if (isCurrent) setState('error');
      });

    return () => {
      isCurrent = false;
    };
  }, [dataKey, endpoint]);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>
        {state === 'loading' && <p role="status">Loading {title.toLowerCase()}...</p>}
        {state === 'error' && <p role="alert">Unable to load {title.toLowerCase()}. Please try again.</p>}
        {state === 'success' && items.length === 0 && <p role="status">{emptyMessage}</p>}
        {state === 'success' && items.length > 0 && (
          <ul className="list-unstyled mb-0">
            {items.map((item, index) => (
              <li className="py-2" key={typeof item._id === 'string' ? item._id : index}>
                {renderItem(item, index)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
