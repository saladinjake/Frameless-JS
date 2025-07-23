export function init(params: any) {
  return {
    sayHello({ event, element, dataset }: {event: Event, element: HTMLElement, dataset: any }) {
        console.log({ event, element, dataset }, "simple binding")
        alert("works")
    },

    onMount() {},
    onDestroy() {},
  };
}


