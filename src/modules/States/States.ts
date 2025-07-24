import { useState } from "../../lib/main";
export function init(ctx: any) {
  const [ count,  setCount, countStore ] = useState(0);
  const [ text,  setText , textStore] = useState("hello");

  return {
    state: {
      count: countStore.state.value, // ✅ proxy access
      text: textStore.state.value,   // ✅ proxy access
    },
    store: textStore,
    increment: () => setCount(prev => prev + 1),
    updateText: (e: any) => setText(e.target.value),
    onMount() {
      console.log("Mounted with", count, text);
    }
  };
}

