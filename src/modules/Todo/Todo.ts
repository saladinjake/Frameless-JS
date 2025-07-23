import { useStore } from "../../lib/main";

export async function init({ props }: { props: any }) {
  const store: any = useStore({
    newItem: '',
    items: ['Eat meat', 'Walk dog', 'Build app'],
  });

  const addItem = () => {
    if (store.state.newItem.trim()) {
      store.state.items.push(store.state.newItem.trim());
      store.state.newItem = '';
    }
  };

  const clearInput = () => {
    store.state.newItem = '';
  };

  const removeItem = (index: number) => {
    store.state.items.splice(index, 1); // ✅ correct index-based removal
  };

  return {
    store,
    template: null, // using inline viewHTML
    props: {
      ...props,
      addItem,
      clearInput,
      removeItem, // ✅ expose it
    },
  };
}

