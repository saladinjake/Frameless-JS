// our custom like pure Functional Component
import { useDomRefs } from "../../src/core/hooks/useDomRefs";
export function init(params) {
   const { refs, $ } = useRefs();
 console.log(params,">>>")
  return {
    onMount() {
      refs?.welcome?.textContent = "Hey there!";
      $('#title')?.textContent = "Updated!";
    }
  };
}
