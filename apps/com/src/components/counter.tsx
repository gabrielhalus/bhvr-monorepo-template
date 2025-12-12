import { useState } from 'react';
import { Button } from '@bunstack/react/components/button';

export function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div className="flex flex-col items-center gap-4 p-8">
      <h2 className="text-2xl font-semibold">Counter: {count}</h2>
      <div className="flex gap-2">
        <Button onClick={() => setCount(count - 1)} variant="outline">
          Decrement
        </Button>
        <Button onClick={() => setCount(0)} variant="secondary">
          Reset
        </Button>
        <Button onClick={() => setCount(count + 1)}>
          Increment
        </Button>
      </div>
    </div>
  );
}
