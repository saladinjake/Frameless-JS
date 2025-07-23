import { interpolateBindings, processDirectives } from "../../directives/processDirectives";
import { applyBindings } from "../interpolationBindings";

// A WeakMap to track cleanup functions per element
export const directiveWatchers = new WeakMap<HTMLElement, (() => void)[]>();

export function observeInterpolationBindings(root: HTMLElement, store: any, props: any = {}) {
  const ATTRS_TO_WATCH = [
    'x-for',
    'x-text',
    'x-if',
    'x-show',
    'x-class',
    'x-bind',
  ];

  const scheduled = new Set<Node>();
  const removed = new Set<Node>();
  let scheduledFrame: number | null = null;

  const applyAll = (nodes: Set<Node>) => {
    for (const node of nodes) {
      if (node instanceof HTMLElement || node instanceof DocumentFragment) {
        interpolateBindings(node, store, props);
        processDirectives(node, store, props);
        // applyBindings(node, store, props);
      }
    }
  };

  const cleanupRemoved = (nodes: Set<Node>) => {
    for (const node of nodes) {
      if (node instanceof HTMLElement) {
        // Example: if you're tracking cleanup functions via WeakMap
        const cleanupFns = directiveWatchers.get(node);
        if (cleanupFns) {
          cleanupFns.forEach(fn => fn());
          directiveWatchers.delete(node);
        }
      }
    }
  };

  const scheduleRender = () => {
    if (scheduledFrame !== null) return;
    scheduledFrame = requestAnimationFrame(() => {
      if (scheduled.size) applyAll(scheduled);
      if (removed.size) cleanupRemoved(removed);
      scheduled.clear();
      removed.clear();
      scheduledFrame = null;
    });
  };

  // Initial hydration
  interpolateBindings(root, store, props);
  processDirectives(root, store, props);

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1 || node.nodeType === 11) {
          scheduled.add(node);
        }
      });

      mutation.removedNodes.forEach((node) => {
        if (node.nodeType === 1) {
          removed.add(node);
        }
      });

      if (mutation.type === 'attributes') {
        const attrName = mutation.attributeName;
        const el = mutation.target as HTMLElement;
        if (
          attrName &&
          (ATTRS_TO_WATCH.includes(attrName) || attrName.startsWith('x-bind:'))
        ) {
          scheduled.add(el);
        }
      }
    }

    scheduleRender();
  });

  observer.observe(root, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: [...ATTRS_TO_WATCH, 'x-for', 'x-text', 'x-if', 'x-show', 'x-class'],
  });

  return observer;
}
